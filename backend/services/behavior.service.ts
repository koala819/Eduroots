import { Behavior } from '@/backend/models/behavior.model'
import { Types } from 'mongoose'

export async function checkBehaviors(courseId: string, date: Date) {
  try {
    const existingBehavior = await Behavior.findOne({
      course: new Types.ObjectId(courseId),
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
      deletedAt: null,
    })
    return existingBehavior
  } catch (error) {
    console.error('Error in checkBehaviors:', error)
    throw error
  }
}

export async function create(data: any) {
  try {
    const behavior = new Behavior(data)
    await behavior.save()
    return behavior
  } catch (error) {
    console.error('Error in create behavior:', error)
    throw error
  }
}

export async function deleteBehavior(id: string) {
  try {
    await Behavior.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    })
  } catch (error) {
    console.error('Error in delete behavior:', error)
    throw error
  }
}

export async function findAll() {
  try {
    return await Behavior.find({ deletedAt: null })
      .populate('course')
      .populate('records.student')
      .sort({ date: -1 })
  } catch (error) {
    console.error('Error in findAll behaviors:', error)
    throw error
  }
}

export async function findDuplicates() {
  try {
    const duplicates = await Behavior.aggregate([
      {
        $match: { deletedAt: null },
      },
      {
        $group: {
          _id: {
            course: '$course',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
              },
            },
          },
          count: { $sum: 1 },
          records: { $push: { id: '$_id' } },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          course: '$_id.course',
          date: '$_id.date',
          records: 1,
        },
      },
    ])
    return duplicates
  } catch (error) {
    console.error('Error in findDuplicates:', error)
    throw error
  }
}

export async function update(id: string, data: any) {
  try {
    const behavior = await Behavior.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    )
    return behavior
  } catch (error) {
    console.error('Error in update behavior:', error)
    throw error
  }
}
