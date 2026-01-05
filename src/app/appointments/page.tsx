"use client";

import { AppointmentConfirmationModal } from "@/components/appointments/AppointmentConfirmationModal";
import BookingConfirmationStep from "@/components/appointments/BookingConfirmationStep";
import DoctorSelectionStep from "@/components/appointments/DoctorSelectionStep";
import ProgressSteps from "@/components/appointments/ProgressSteps";
import TimeSelectionStep from "@/components/appointments/TimeSelectionStep";
import Navbar from "@/components/Navbar";
import { useBookAppointment, useUserAppointments } from "@/hooks/use-appointment";
import { APPOINTMENT_TYPES } from "@/lib/utils";
import { format, isAfter, isSameDay, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

function AppointmentsPage() {
  // state management for the booking process - this could be done with something like Zustand for larger apps
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: select doctor, 2: select time, 3: confirm
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);

  const bookAppointmentMutation = useBookAppointment();
  const { data: userAppointments = [] } = useUserAppointments();

  const handleSelectDoctor = (doctorId: string) => {
    setSelectedDoctorId(doctorId);

    // reset the state when doctor changes
    setSelectedDate("");
    setSelectedTime("");
    setSelectedType("");
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const appointmentType = APPOINTMENT_TYPES.find((t) => t.id === selectedType);

    // Extract duration number from string like "60 min" or "120 min"
    const durationMinutes = appointmentType?.duration
      ? parseInt(appointmentType.duration.replace(/\D/g, ''))
      : undefined;

    bookAppointmentMutation.mutate(
      {
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedTime,
        reason: appointmentType?.name,
        duration: durationMinutes,
      },
      {
        onSuccess: (appointment) => {
          // store the appointment details to show in the modal
          setBookedAppointment(appointment);

          // Email is automatically sent by Motia backend event handler
          // (backend/src/events/appointment-created.step.ts listens to appointment.created event)

          // show the success modal
          setShowConfirmationModal(true);

          // reset form
          setSelectedDoctorId(null);
          setSelectedDate("");
          setSelectedTime("");
          setSelectedType("");
          setCurrentStep(1);
        },
        onError: (error) => toast.error(`Failed to book appointment: ${error.message}`),
      }
    );
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">Find and book with verified practitioners in your area</p>
        </div>

        <ProgressSteps currentStep={currentStep} />

        {currentStep === 1 && (
          <DoctorSelectionStep
            selectedDoctorId={selectedDoctorId}
            onContinue={() => setCurrentStep(2)}
            onSelectDoctor={handleSelectDoctor}
          />
        )}

        {currentStep === 2 && selectedDoctorId && (
          <TimeSelectionStep
            selectedDoctorId={selectedDoctorId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedType={selectedType}
            onBack={() => setCurrentStep(1)}
            onContinue={() => setCurrentStep(3)}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onTypeChange={setSelectedType}
          />
        )}

        {currentStep === 3 && selectedDoctorId && (
          <BookingConfirmationStep
            selectedDoctorId={selectedDoctorId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedType={selectedType}
            isBooking={bookAppointmentMutation.isPending}
            onBack={() => setCurrentStep(2)}
            onModify={() => setCurrentStep(2)}
            onConfirm={handleBookAppointment}
          />
        )}
      </div>

      {bookedAppointment && (
        <AppointmentConfirmationModal
          open={showConfirmationModal}
          onOpenChange={setShowConfirmationModal}
          appointmentDetails={{
            doctorName: bookedAppointment.doctorName,
            appointmentDate: format(new Date(bookedAppointment.date), "EEEE, MMMM d, yyyy"),
            appointmentTime: bookedAppointment.time,
            userEmail: bookedAppointment.patientEmail,
          }}
        />
      )}

      {/* SHOW EXISTING APPOINTMENTS FOR THE CURRENT USER */}
      {(() => {
        // Filter for upcoming CONFIRMED appointments only (today or future)
        const upcomingAppointments = userAppointments.filter((appointment) => {
          const appointmentDate = parseISO(appointment.date);
          const today = new Date();
          const isUpcoming = isSameDay(appointmentDate, today) || isAfter(appointmentDate, today);
          return isUpcoming && appointment.status === "CONFIRMED";
        });

        return upcomingAppointments.length > 0 ? (
          <div className="mb-8 max-w-7xl mx-auto px-6 py-8">
            <h2 className="text-xl font-semibold mb-4">Your Upcoming Appointments</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-card border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <img
                        src={appointment.doctorImageUrl}
                        alt={appointment.doctorName}
                        className="size-10 rounded-full"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{appointment.doctorName}</p>
                      <p className="text-muted-foreground text-xs">{appointment.reason}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      📅 {format(new Date(appointment.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-muted-foreground">🕐 {appointment.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}
    </>
  );
}

export default AppointmentsPage;
