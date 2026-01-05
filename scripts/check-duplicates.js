/**
 * Script to check for duplicate appointments in the database
 * Run with: node scripts/check-duplicates.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate appointments...\n')

  try {
    // Find all appointments
    const appointments = await prisma.appointment.findMany({
      select: {
        id: true,
        userId: true,
        doctorId: true,
        date: true,
        time: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ userId: 'asc' }, { date: 'asc' }, { time: 'asc' }],
    })

    console.log(`📊 Total appointments: ${appointments.length}\n`)

    // Group appointments by userId + doctorId + date + time + status
    const grouped = new Map()

    for (const apt of appointments) {
      const key = `${apt.userId}|${apt.doctorId}|${apt.date.toISOString().split('T')[0]}|${apt.time}|${apt.status}`

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key).push(apt)
    }

    // Find duplicates
    const duplicates = []
    for (const [key, apts] of grouped.entries()) {
      if (apts.length > 1) {
        duplicates.push({ key, appointments: apts })
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No duplicate appointments found!')
      console.log('✅ Safe to add unique constraint to the database.\n')
    } else {
      console.log(`❌ Found ${duplicates.length} sets of duplicate appointments:\n`)

      for (let i = 0; i < duplicates.length; i++) {
        const dup = duplicates[i]
        const [userId, doctorId, date, time, status] = dup.key.split('|')

        console.log(`Duplicate Set #${i + 1}:`)
        console.log(`  User ID: ${userId}`)
        console.log(`  Doctor ID: ${doctorId}`)
        console.log(`  Date: ${date}`)
        console.log(`  Time: ${time}`)
        console.log(`  Status: ${status}`)
        console.log(`  Count: ${dup.appointments.length} appointments`)
        console.log(`  IDs: ${dup.appointments.map(a => a.id).join(', ')}`)
        console.log(`  Created: ${dup.appointments.map(a => a.createdAt.toISOString()).join(', ')}`)
        console.log('')
      }

      console.log('⚠️  WARNING: You must remove duplicates before adding unique constraint!')
      console.log('💡 Suggested action: Keep the oldest appointment (by createdAt) and delete the rest.\n')
    }

    // Check for overlapping appointments (same user, different doctors, same time)
    const userTimeMap = new Map()

    for (const apt of appointments) {
      const key = `${apt.userId}|${apt.date.toISOString().split('T')[0]}|${apt.time}`

      if (!userTimeMap.has(key)) {
        userTimeMap.set(key, [])
      }
      userTimeMap.get(key).push(apt)
    }

    const overlaps = []
    for (const [key, apts] of userTimeMap.entries()) {
      if (apts.length > 1 && apts[0].status === 'CONFIRMED') {
        const uniqueDoctors = new Set(apts.map(a => a.doctorId))
        if (uniqueDoctors.size > 1) {
          overlaps.push({ key, appointments: apts })
        }
      }
    }

    if (overlaps.length > 0) {
      console.log(`⚠️  Found ${overlaps.length} time conflicts (same user booked with multiple doctors at same time):\n`)

      for (let i = 0; i < overlaps.length; i++) {
        const overlap = overlaps[i]
        const [userId, date, time] = overlap.key.split('|')

        console.log(`Conflict #${i + 1}:`)
        console.log(`  User ID: ${userId}`)
        console.log(`  Date: ${date}`)
        console.log(`  Time: ${time}`)
        console.log(`  Doctors: ${overlap.appointments.map(a => a.doctorId).join(', ')}`)
        console.log(`  Appointment IDs: ${overlap.appointments.map(a => a.id).join(', ')}`)
        console.log('')
      }
    }

  } catch (error) {
    console.error('❌ Error checking duplicates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicates()
