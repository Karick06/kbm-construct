# Automated Timesheet System with Geofencing

## Overview

The KBM Construct timesheet system uses GPS geofencing to automatically track employee time and attendance. When employees enter or exit geofenced areas (project sites or office locations), their time is automatically recorded.

## Features

### 1. **Automatic Time Tracking**
- Employees are automatically clocked in when entering a geofenced area
- Automatically clocked out when leaving
- Time is tracked down to the minute
- No manual entry required in normal operation

### 2. **Multiple Geofence Types**
- **Office Locations**: Company offices and warehouses
- **Project Sites**: Active construction and service locations
- Each geofence has a configurable radius (default 100-200 meters)

### 3. **Real GPS Integration**
- Uses browser's Geolocation API for real-time position tracking
- High accuracy mode enabled for precise location detection
- Continuous background tracking while app is open
- Position updates every 5 seconds with 10-meter minimum change threshold

### 4. **Timesheet Features**
- Daily timesheet entries grouped by geofence
- View total hours per day/week/month
- Manual clock in/out capability
- Add notes to timesheet entries
- Submit timesheets for approval
- Approval workflow (Draft → Submitted → Approved/Rejected)

## How It Works

### Geofencing Algorithm

The system uses the **Haversine formula** to calculate the distance between the user's current position and all defined geofences:

```
distance = R * C
where:
  R = Earth radius (6,371 km)
  C = central angle between two points
```

If distance ≤ geofence radius, the employee is inside that geofence.

### Clock In/Out Flow

1. **Entry Detection**
   ```
   Employee enters geofence area
   → Location tracked via GPS
   → Distance calculated
   → If within radius:
      • Create clock-in entry
      • Record geofence name, time, coordinates
      • Add to daily timesheet
   ```

2. **Exit Detection**
   ```
   Employee leaves geofence area
   → Location tracked via GPS
   → Distance calculated
   → If outside radius:
      • Close active timesheet entry
      • Calculate duration
      • Mark as 'completed'
   ```

3. **Timesheet Aggregation**
   ```
   Multiple clock-in/out events
   → Grouped by date
   → Grouped by geofence
   → Total hours calculated
   → Ready for submission
   ```

## Defined Geofences

### Office Locations

| Name | Location | Radius |
|------|----------|--------|
| Valescape HQ | London, UK | 100m |
| Birmingham Warehouse | Birmingham | 150m |

### Project Sites

| Name | Location | Radius |
|------|----------|--------|
| London Construction Site | East London | 200m |
| Manchester Construction Site | Manchester | 200m |

## API Endpoints

### Timesheets

**GET** `/api/timesheets`
- Query: `employeeId`, `date`
- Response: Array of daily timesheets

**POST** `/api/timesheets/clock`
- Body: `{ employeeId, latitude, longitude, action: 'clock-in' | 'clock-out' }`
- Response: Clock entry record

### Geofences

**GET** `/api/geofences`
- Response: Array of geofence definitions

## Pages

### Resources Section > Timesheets (Overview)
- Dashboard with weekly/monthly hours
- Current clock in/out status
- Recent locations visited
- Quick clock in/out button

### Resources Section > My Timesheets
- Personal timesheet history
- Submission status tracking
- Detailed entry breakdown
- Manual entry creation

### Resources Section > Geofences
- All configured office and project locations
- Add/edit/delete geofences
- Map view of boundaries
- Active/inactive toggle

## Technical Implementation

### Location Permission

The app requests location permission on first use:
```
Browser Geolocation API → User grants permission → Continuous tracking enabled
```

**Permissions Required:**
- `navigator.geolocation` - High accuracy GPS
- Background tracking while app is active

### Data Storage

Mock API endpoints ready for database integration:
- Timesheet entries → TimesheetEntry table
- Geofences → Geofence table
- Daily aggregations → DailyTimesheet table

### Position Watching

```typescript
// Starts continuous location monitoring
locationTracker.startTracking((lat, lon, geofenceName) => {
  // Update timesheet when location changes
  // Trigger clock in/out when crossing boundaries
});
```

## Usage

### For Employees

1. **Enable Location Tracking**
   - Open Resources > Timesheets
   - Browser will request location permission
   - Click "Allow" to enable GPS tracking

2. **Clock In**
   - Arrive at project site or office
   - GPS automatically detects geofence entry
   - Timesheet entry created automatically
   - OR click "Clock In via GPS" button if manual action needed

3. **Clock Out**
   - Leave project site
   - GPS automatically detects geofence exit
   - Timesheet entry closed and duration calculated
   - OR click "Clock Out via GPS" button if manual

4. **Submit Timesheet**
   - Go to My Timesheets
   - Review daily entries
   - Click "Submit" to send for approval

### For Managers

1. **Configure Geofences**
   - Go to Resources > Geofences
   - Click "Add" to define new location
   - Enter coordinates and radius
   - Activate for tracking

2. **Review Timesheets**
   - Go to Timesheets overview
   - View employee hours by location
   - Compare against project schedules
   - Approve or reject submissions

3. **Track Attendance**
   - View daily/weekly/monthly totals
   - Identify patterns
   - Export for payroll processing

## Limitations & Considerations

### GPS Accuracy
- Accuracy depends on device and environment (indoor vs outdoor)
- May take 5-30 seconds for initial GPS lock
- Urban canyons and buildings can reduce accuracy
- ±5-15 meter accuracy typical

### Battery Usage
- Continuous GPS tracking consumes significant battery
- Recommend plugging in device during work hours
- Or use manual clock in/out for extended shifts

### Network
- Requires internet connection to sync with server
- Offline entries can be synced when connection returns
- (Not yet implemented - future enhancement)

## Future Enhancements

- [ ] Stop location tracking when clocked out
- [ ] Offline support with local caching
- [ ] Photo attachment for geofence verification
- [ ] Supervisor override capability
- [ ] Integration with payroll system
- [ ] Mobile app with background tracking
- [ ] Machine learning for commute time detection
- [ ] Integration with Sage for direct payroll sync

## Security & Privacy

**Data Protection:**
- Location data stored with employee ID
- Coordinates retained for 30 days (configurable)
- Audit log of all clock in/out events
- GDPR compliant data retention policies

**Permissions:**
- Only HR and supervisors can view employee timesheets
- Employees can only see their own full details
- Limited view for project managers (team only)
