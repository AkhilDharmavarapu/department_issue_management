# Classroom Schema Upgrade - Structured Academic Format

## Overview
The Classroom schema has been upgraded to support a properly structured academic format with individual fields for course type, specialization, year level, section, and room assignment.

---

## New Schema Structure

### Fields Added

#### `course` (Required)
- **Type:** String (Enum)
- **Values:** `"BTech"` or `"MTech"`
- **Description:** Type of academic program
- **Example:** `"BTech"`

#### `specialization` (Required)
- **Type:** String
- **Description:** Program specialization/branch code
- **Examples:** `"CSE"`, `"ECE"`, `"ME"`, `"AIML"`, `"CNS"`
- **Note:** Stored in UPPERCASE

#### `year` (Required, Course-Dependent)
- **Type:** Number
- **Range for BTech:** 1-4
- **Range for MTech:** 1-2
- **Description:** Academic year level
- **Validation:** Automatically validates based on course type

#### `section` (Required)
- **Type:** String
- **Description:** Class section identifier
- **Examples:** `"A"`, `"B"`, `"C"`, `"A1"`
- **Note:** Stored in UPPERCASE

#### `room` (Required)
- **Type:** String
- **Description:** Room number or room ID for the classroom
- **Examples:** `"201"`, `"Lab-105"`, `"301-B"`

### Fields Retained

- `department` - Department name (kept for backward compatibility)
- `programDuration` - Auto-set based on course (4 for BTech, 2 for MTech)
- `cr` - Class Representative (ObjectId reference)
- `lr` - Lab Representative (ObjectId reference)
- `facultyList` - Array of faculty ObjectIds
- `timestamps` - createdAt and updatedAt

---

## Unique Constraint

### Compound Unique Index
```javascript
{ course: 1, specialization: 1, year: 1, section: 1 }
```

**Guarantee:** No two classrooms can exist with the same:
- Course type (BTech/MTech)
- Specialization (CSE, ECE, etc.)
- Academic year
- Section

**Example:** Only one classroom can exist for:
- `BTech + CSE + Year 3 + Section A`
- `BTech + ECE + Year 2 + Section B`
- `MTech + AIML + Year 1 + Section A`

---

## API Request/Response Examples

### Create Classroom Request

**Endpoint:** `POST /api/classrooms`

**Request Body:**
```json
{
  "course": "BTech",
  "specialization": "CSE",
  "year": 3,
  "section": "A",
  "room": "301",
  "department": "Computer Science",
  "cr": "user_id_here",
  "lr": "user_id_here",
  "facultyList": ["faculty_id_1", "faculty_id_2"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Classroom created successfully",
  "data": {
    "_id": "classroom_id",
    "course": "BTech",
    "specialization": "CSE",
    "year": 3,
    "section": "A",
    "room": "301",
    "department": "Computer Science",
    "programDuration": 4,
    "cr": { "_id": "user_id", "name": "John Doe", ... },
    "lr": { "_id": "user_id", "name": "Jane Smith", ... },
    "facultyList": [...],
    "createdAt": "2026-04-16T10:30:00Z",
    "updatedAt": "2026-04-16T10:30:00Z"
  }
}
```

### Get Classrooms with Filters

**Endpoint:** `GET /api/classrooms?course=BTech&specialization=CSE&year=3`

**Query Parameters:**
- `course` - Filter by course type
- `specialization` - Filter by specialization
- `year` - Filter by year
- `section` - Filter by section
- `room` - Filter by room
- `department` - Filter by department

### Update Classroom Request

**Endpoint:** `PUT /api/classrooms/:id`

**Request Body (All Optional):**
```json
{
  "year": 4,
  "section": "B",
  "room": "302",
  "cr": "new_cr_user_id",
  "facultyList": ["faculty_id_1", "faculty_id_3"]
}
```

---

## Validation Rules

### 1. Course-Year Validation
- ✅ `BTech` with year 1-4
- ✅ `MTech` with year 1-2
- ❌ `BTech` with year 5 → Error
- ❌ `MTech` with year 3 → Error

### 2. Required Field Validation
- `course` - Must be provided and be `BTech` or `MTech`
- `specialization` - Must be provided and non-empty
- `year` - Must be provided and valid for the course
- `section` - Must be provided and non-empty
- `room` - Must be provided and non-empty

### 3. Uniqueness Validation
```javascript
// These would FAIL with duplicate error:
{
  course: "BTech",
  specialization: "CSE",
  year: 3,
  section: "A"
  // Already exists in database
}
```

### 4. Reference Validation
- If `cr` is provided, user must exist
- If `lr` is provided, user must exist
- If `facultyList` items are provided, users must exist

---

## Data Migration Guide

### For Existing Systems

If you have existing classrooms, you'll need to migrate them. The system will reject any operations unless all required fields are present.

#### Option 1: Manual Update via API

```bash
# Update each existing classroom
curl -X PUT http://localhost:5000/api/classrooms/CLASSROOM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "course": "BTech",
    "specialization": "CSE",
    "year": 3,
    "section": "A",
    "room": "301"
  }'
```

#### Option 2: Database Migration Script

Create a migration script to update all existing classrooms:

```javascript
// scripts/migrateClassroom.js
const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');

const courseMapping = {
  'Computer Science': 'CSE',
  'Electronics': 'ECE',
  'Mechanical': 'ME',
};

async function migrateClassrooms() {
  try {
    const classrooms = await Classroom.find({});
    
    for (let classroom of classrooms) {
      if (!classroom.course) {
        // Set defaults based on existing data
        classroom.course = 'BTech';
        classroom.specialization = courseMapping[classroom.department] || 'CSE';
        classroom.room = classroom.room || 'TBD';
        await classroom.save();
        console.log(`✓ Migrated: ${classroom.department} Y${classroom.year} S${classroom.section}`);
      }
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateClassrooms();
```

---

## Frontend Integration Updates

### Classroom Form Example

The frontend should now collect these fields when creating/editing classrooms:

```jsx
<form onSubmit={handleSubmit}>
  {/* Course Selection */}
  <select name="course" value={formData.course} onChange={handleChange} required>
    <option value="">Select Course</option>
    <option value="BTech">Bachelor of Technology (BTech)</option>
    <option value="MTech">Master of Technology (MTech)</option>
  </select>

  {/* Specialization */}
  <input 
    type="text" 
    name="specialization" 
    placeholder="e.g., CSE, ECE, ME"
    value={formData.specialization} 
    onChange={handleChange} 
    required 
  />

  {/* Year */}
  <select name="year" value={formData.year} onChange={handleChange} required>
    <option value="">Select Year</option>
    {formData.course === 'BTech' && (
      <>
        <option value="1">Year 1</option>
        <option value="2">Year 2</option>
        <option value="3">Year 3</option>
        <option value="4">Year 4</option>
      </>
    )}
    {formData.course === 'MTech' && (
      <>
        <option value="1">Year 1</option>
        <option value="2">Year 2</option>
      </>
    )}
  </select>

  {/* Section */}
  <input 
    type="text" 
    name="section" 
    placeholder="e.g., A, B, C"
    value={formData.section} 
    onChange={handleChange} 
    required 
  />

  {/* Room */}
  <input 
    type="text" 
    name="room" 
    placeholder="e.g., 301, Lab-105"
    value={formData.room} 
    onChange={handleChange} 
    required 
  />

  <button type="submit">Create Classroom</button>
</form>
```

---

## Index Information

### Indexes Created

1. **Unique Compound Index**
   - Index: `{ course: 1, specialization: 1, year: 1, section: 1 }`
   - Name: `unique_academic_structure`
   - Purpose: Prevent duplicate classrooms

2. **Course + Specialization Index**
   - Index: `{ course: 1, specialization: 1 }`
   - Purpose: Fast lookup by course and specialization

3. **Year Index**
   - Index: `{ year: 1 }`
   - Purpose: Fast lookup by academic year

4. **Faculty List Index**
   - Index: `{ facultyList: 1 }`
   - Purpose: Fast lookup of classrooms by faculty

---

## Error Handling

### Possible Error Responses

#### 400 Bad Request - Missing Required Fields
```json
{
  "success": false,
  "message": "Please provide course, specialization, year, section, and room"
}
```

#### 400 Bad Request - Invalid Course
```json
{
  "success": false,
  "message": "Course must be either BTech or MTech"
}
```

#### 400 Bad Request - Invalid Year
```json
{
  "success": false,
  "message": "Year must be between 1 and 4 for BTech"
}
```

#### 409 Conflict - Duplicate Classroom
```json
{
  "success": false,
  "message": "E11000 duplicate key error: Classroom with this course, specialization, year, and section already exists"
}
```

#### 404 Not Found - Invalid User Reference
```json
{
  "success": false,
  "message": "CR user not found"
}
```

---

## Backward Compatibility Notes

- **BREAKING CHANGE:** All new classrooms MUST include: `course`, `specialization`, `year`, `section`, `room`
- Existing API calls without these fields will fail
- The `department` field is retained but no longer required
- The `programDuration` field is automatically set based on course type

---

## Testing Checklist

- ✓ Creating classroom with all required fields
- ✓ Creating classroom with missing required fields (should fail)
- ✓ Creating duplicate classroom (should fail with unique constraint)
- ✓ Updating classroom with valid year for course
- ✓ Updating classroom with invalid year for course (should fail)
- ✓ Filtering classrooms by course
- ✓ Filtering classrooms by specialization
- ✓ Filtering classrooms by year
- ✓ Filtering classrooms by combined criteria
- ✓ Verifying programDuration auto-set to 4 for BTech
- ✓ Verifying programDuration auto-set to 2 for MTech

---

## Summary of Changes

| Item | Before | After |
|------|--------|-------|
| **Required Fields** | 3 (department, year, section) | 5 (course, specialization, year, section, room) |
| **Year Validation** | Enum [1,2,3,4] | Conditional: 1-4 for BTech, 1-2 for MTech |
| **Uniqueness** | None | Compound index on (course, specialization, year, section) |
| **Data Model** | Flat | Structured academic hierarchy |
| **Specialization** | Not standardized | Uppercase, standardized codes |

