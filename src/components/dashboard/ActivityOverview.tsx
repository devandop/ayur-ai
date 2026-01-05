import WellnessOverview from "./WellnessOverview";
import NextAppointment from "./NextAppointment";

function ActivityOverview() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <WellnessOverview />
      <NextAppointment />
    </div>
  );
}
export default ActivityOverview;
