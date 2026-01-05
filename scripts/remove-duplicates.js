/**
 * Script to remove duplicate appointments
 * Run with: node scripts/remove-duplicates.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeDuplicates() {
  console.log('🗑️  Removing duplicate appointments...\n')

  try {
    // The duplicate ID to delete (newer one)
    const duplicateId = 'cmjh3806v0003th1w494vdhyc'
    const keepId = 'cmjh37koo0001th1wnaep19bk'

    // First, verify the appointments exist
    const duplicateApt = await prisma.appointment.findUnique({
      where: { id: duplicateId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        doctor: { select: { name: true } },
      },
    })

    const keepApt = await prisma.appointment.findUnique({
      where: { id: keepId },
    })

    if (!duplicateApt) {
      console.log('✅ Duplicate appointment already deleted or not found.')
      return
    }

    if (!keepApt) {
      console.log('❌ ERROR: Original appointment not found. Aborting for safety.')
      return
    }

    console.log('Found duplicate to delete:')
    console.log(`  ID: ${duplicateApt.id}`)
    console.log(`  Patient: ${duplicateApt.user.firstName} ${duplicateApt.user.lastName}`)
    console.log(`  Doctor: ${duplicateApt.doctor.name}`)
    console.log(`  Date: ${duplicateApt.date.toISOString().split('T')[0]}`)
    console.log(`  Time: ${duplicateApt.time}`)
    console.log(`  Created: ${duplicateApt.createdAt.toISOString()}\n`)

    // Delete the duplicate
    await prisma.appointment.delete({
      where: { id: duplicateId },
    })

    console.log('✅ Duplicate appointment deleted successfully!')
    console.log(`✅ Kept appointment ID: ${keepId}\n`)

    // Verify deletion
    const remaining = await prisma.appointment.findMany({
      where: {
        userId: duplicateApt.userId,
        doctorId: duplicateApt.doctorId,
        date: duplicateApt.date,
        time: duplicateApt.time,
        status: duplicateApt.status,
      },
    })

    console.log(`📊 Remaining appointments for this slot: ${remaining.length}`)
    if (remaining.length === 1) {
      console.log('✅ Success! Only one appointment remains.\n')
      console.log('🎉 You can now safely add the unique constraint to your schema!')
    } else if (remaining.length > 1) {
      console.log('⚠️  Warning: Still multiple appointments found. May need manual cleanup.')
    }

  } catch (error) {
    console.error('❌ Error removing duplicates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeDuplicates()
