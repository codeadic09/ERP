# Attendance Notification Feature

## Overview
This document describes the new attendance notification feature that automatically sends notices to students when their attendance is marked by a subject teacher.

## Feature Description
When a subject teacher marks student attendance in the faculty dashboard's attendance section, the system automatically creates a **notice** that is immediately broadcast to all students. This keeps students informed about their attendance status in real-time.

## Implementation Details

### Modified File
- **File:** [app/dashboard/faculty/attendance/page.tsx](app/dashboard/faculty/attendance/page.tsx)

### Changes Made

#### 1. **Import Addition**
Added `addNotice` function to imports from `@/lib/db`:
```typescript
import {
  getUsers, getDepartments,
  getAttendance, upsertAttendance,
  getSubjectsByFacultyId,
  getStudentsEnrolledInSubject,
  addNotice,  // ← NEW
} from "@/lib/db"
```

#### 2. **Notice Creation Logic**
Enhanced the `handleSave()` function to automatically create a notice after attendance is saved:

**Location:** handleSave function (after upsertAttendance call)

**Process:**
1. Extracts and formats the attendance date as `DD/MM/YY` format
2. Creates a notice with:
   - **Title:** "Attendance Marked"
   - **Body:** `Your attendance for (DD/MM/YY) {SubjectName} lecture is marked`
   - **Target:** "Students" (broadcast to all students)
   - **Urgent:** false (can be changed if needed)
   - **Created By:** Faculty member's ID

3. Error handling is in place - if notice creation fails, attendance marking continues without blocking

**Code:**
```typescript
// Format date as DD/MM/YY
const dateParts = selectedDate.split('-')
const day = dateParts[2]
const month = dateParts[1]
const year = dateParts[0].slice(-2)
const formattedDate = `${day}/${month}/${year}`

// Create notice for students about attendance
await addNotice({
  title: "Attendance Marked",
  body: `Your attendance for (${formattedDate}) ${subjectName} lecture is marked`,
  target: "Students",
  urgent: false,
  created_by: myId ?? null,
}).catch(err => {
  console.error("Failed to create notice:", err)
  // Continue even if notice creation fails
})
```

## How It Works for Students

1. **Faculty marks attendance** → Faculty navigates to Attendance section, selects subject and date, marks attendance, clicks Save
2. **Notice is created** → System automatically creates a notice with attendance information
3. **Student notification** → Notice appears in:
   - Student's notice board ([/dashboard/student/notices](app/dashboard/student/notices/page.tsx))
   - Header notification dropdown (updates on refresh or within 60 seconds)
4. **Student sees message** → "Your attendance for (21/3/26) Mathematics lecture is marked"

## Features & Benefits

✅ **Immediate Notification** - Students are informed right after attendance is marked
✅ **Clear Information** - Message includes date (DD/MM/YY format) and subject name
✅ **Non-intrusive** - Works through the existing notice system, no email spam
✅ **Broadcast Efficiency** - Single notice for all students (not one per student)
✅ **Error Handling** - If notice creation fails, attendance marking still completes
✅ **User Context** - Notice clearly indicates which class/subject the attendance is for

## Technical Architecture

```
Faculty Dashboard (Attendance Page)
    ↓
    Marks Attendance for students in a subject
    ↓
    upsertAttendance() - saves to DB
    ↓
    addNotice() - creates broadcast notice to all students
    ↓
    Notice appears in:
    - /dashboard/student/notices (notice board)
    - Header notification menu
```

## Database Tables Affected

1. **attendance table** - Attendance records (unchanged)
2. **notices table** - New notice record created with target="Students"

## Testing

To test this feature:

1. **Login as Faculty** - Access faculty dashboard
2. **Navigate to Attendance** - Go to `/dashboard/faculty/attendance`
3. **Select Subject & Date** - Choose a subject and date
4. **Mark Attendance** - Select students and mark them present/absent/late
5. **Click Save** - Notice is automatically created
6. **Login as Student** - Check `/dashboard/student/notices`
7. **Verify Notice** - You should see the attendance notification message

## Notes

- The notice targets "Students" to reach all students in the system
- Students will understand the notice applies to them based on subject name and date
- The notice system uses client-side polling (refreshes every ~60 seconds)
- For immediate visibility, students should refresh or check notices manually
- The faculty member's ID is recorded in the notice's `created_by` field

## Future Enhancements

Potential improvements (out of scope for current implementation):
- `[ ]` Send email notifications alongside notice board notifications
- `[ ]` Personalized notices per student (requires schema changes)
- `[ ]` Attendance summary emails for parents
- `[ ]` Configurable notice urgency based on absence threshold
- `[ ]` Real-time websocket notifications instead of polling
- `[ ]` SMS notifications for critical low attendance alerts
