import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const inputSchema = z.object({
  appointmentId: z.string(),
  patientEmail: z.string().email(),
  patientName: z.string(),
  doctorName: z.string(),
  doctorEmail: z.string(),
  date: z.string(),
  time: z.string(),
  reason: z.string(),
})

// Ensure that the event handler name matches what is expected in Handlers
export const config: EventConfig = {
  type: 'event',
  name: 'AppointmentCancelledEmail',  // Your event name here
  description: 'Send cancellation email when appointment is cancelled',
  subscribes: ['appointment.cancelled'], // The event this handler will subscribe to
  emits: [],
  input: inputSchema,  // Ensures input validation using the schema you defined
  flows: ['appointment-management'],  // Ensure this is the right flow to execute this handler
}

// Handler for AppointmentCancelledEmail event
// (Do not type with Handlers, just use the correct shape as per Motia event step patterns)
export const handler = async (
  input: z.infer<typeof inputSchema>,
  { logger }: { logger: any }
) => {
  const { appointmentId, patientEmail, patientName, doctorName, date, time, reason } = input

  logger.info('Sending appointment cancellation email', {
    appointmentId,
    patientEmail,
  })

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; margin: 0; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: #2563eb; margin: 0;">DentWise</h2>
            </div>

            <h1 style="color: #1f2937; font-size: 24px; text-align: center; margin: 30px 0;">Appointment Cancelled</h1>

            <p style="color: #374151; font-size: 16px; line-height: 26px;">Hi ${patientName},</p>

            <p style="color: #374151; font-size: 16px; line-height: 26px;">
              Your appointment has been successfully cancelled. Here are the details of the cancelled appointment:
            </p>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 8px 0 4px 0;">Doctor</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">${doctorName}</p>

              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 8px 0 4px 0;">Appointment Type</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">${reason}</p>

              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 8px 0 4px 0;">Date</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">${date}</p>

              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 8px 0 4px 0;">Time</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">${time}</p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 26px;">
              If you'd like to book a new appointment, please visit our appointments page.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments"
                 style="background-color: #2563eb; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 24px; display: inline-block;">
                Book New Appointment
              </a>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 32px 0 16px 0;">
              Best regards,<br/>
              The DentWise Team
            </p>

            <p style="color: #6b7280; font-size: 14px; line-height: 24px; text-align: center;">
              If you have any questions, please contact us at support@dentwise.com
            </p>
          </div>
        </body>
      </html>
    `

    // In development, Resend only allows sending to verified email addresses
    const isDevelopment = process.env.NODE_ENV !== 'production'
    const adminEmail = process.env.ADMIN_EMAIL || ''
    const emailRecipient = isDevelopment && adminEmail ? adminEmail : patientEmail

    if (isDevelopment && emailRecipient !== patientEmail) {
      logger.info('Development mode: Sending email to admin instead of patient', {
        originalRecipient: patientEmail,
        actualRecipient: emailRecipient,
      })
    }

    const { data, error } = await resend.emails.send({
      from: 'DentWise <onboarding@resend.dev>',
      to: [emailRecipient],
      subject: `Appointment Cancelled - ${date} at ${time}`,
      html: emailHtml,
    })

    if (error) {
      logger.error('Failed to send cancellation email', {
        appointmentId,
        error: error.message,
      })

      if (isDevelopment) {
        logger.warn('Email sending failed in development mode (expected with unverified domain)', {
          appointmentId,
          intendedRecipient: patientEmail,
        })
        return
      }

      throw new Error(`Email sending failed: ${error.message}`)
    }

    logger.info('Appointment cancellation email sent successfully', {
      appointmentId,
      patientEmail,
      emailId: data?.id,
    })
  } catch (error: any) {
    logger.error('Error in appointment cancellation email handler', {
      appointmentId,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}
