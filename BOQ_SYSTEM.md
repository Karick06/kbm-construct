# Bill of Quantities (BoQ) System Documentation

## Overview

KBM Construct's BoQ system supports three major UK construction measurement standards for creating detailed Bills of Quantities. Each standard has specific sections, terminology, and measurement rules tailored to different project types.

## Supported Standards

### 1. SMM7 - Standard Method of Measurement (7th Edition)

**Purpose:** Building construction and related works measurement

**Used For:**
- Residential and commercial buildings
- Extensions and alterations
- Interior fit-out works
- Refurbishment projects
- General building construction

**Key Sections (A-R):**
- **A:** General/Preliminaries
- **B:** Demolitions
- **C:** Ground Works
- **D:** Concrete Works (in-situ and pre-cast)
- **E:** Unit Masonry
- **F:** Steelwork (structural and misc)
- **G:** Carpentry/Timber
- **H:** Roofing
- **I:** Cladding/External walls
- **J:** Internal Partitions/Linings
- **K:** Doors, Windows & Screens
- **L:** Finishings (screed, flooring, finishes)
- **M:** Decorations (painting, wallpaper)
- **N:** Services (M&E, plumbing, heating)
- **P:** Drainage and Sewerage
- **R:** External Works (landscaping, hardworks)

**Example Item:**
```
Item: A.1.1.1
Description: Preliminaries - Site set-up, welfare facilities, insurance
Unit: sum
Quantity: 1
Rate: £25,000
Amount: £25,000
```

**Common Units:**
- m, m², m³ (linear, area, volume measurements)
- no (number of items)
- tonnes (for heavy works)

---

### 2. CESMM - Civil Engineering Standard Method of Measurement

**Purpose:** Civil engineering works measurement and cost estimation

**Used For:**
- Highway and roads
- Railway construction
- Bridges and structures
- Tunnels and underground works
- Water engineering projects
- Earthworks and land development

**Key Sections (A-K):**
- **A:** General and Contract Requirements
- **B:** Site Investigation
- **C:** Geotechnical Works
- **D:** Earthworks (excavation, filling, leveling)
- **E:** Concrete Works (concrete structures)
- **F:** Steelwork (structural members)
- **G:** Timber Work (timber and timber piles)
- **H:** Surface Works (pavements, surfacing, markings)
- **I:** Drainage Systems
- **J:** Utilities (water, gas, electricity)
- **K:** Rail Works (if applicable)

**Example Item:**
```
Item: D.1.1.1
Description: General excavation of oversite in wet ground
Unit: m³
Quantity: 2,500
Rate: £12.50
Amount: £31,250
```

**Common Units:**
- m³ (cubic meters - primary unit for earth/excavation)
- m² (square meters - for surface works)
- m (linear meters - for services/utilities)
- tonnes (for materials and fill)

---

### 3. SHW - Specification for Highways Works

**Purpose:** Highway and road works measurement and specification

**Used For:**
- Motorway and trunk road construction
- Rural road construction and upgrading
- Urban street works
- Parking areas and infrastructure
- Highway maintenance and resurfacing
- Traffic and safety infrastructure

**Key Sections (A-I):**
- **A:** General (general and contract requirements)
- **B:** Demolition (demolition of existing structures)
- **C:** Earthworks (site preparation and earthworks)
- **D:** Cuttings & Embankments (cut and fill works)
- **E:** Foundations (pavement foundations and base courses)
- **F:** Pavement (surfacing and wearing courses)
- **G:** Drainage (highway drainage systems)
- **H:** Traffic Features (markings, signs, safety barriers)
- **I:** Fencing & Boundaries (fencing and perimeter works)

**Example Item:**
```
Item: F.1.1.1
Description: New bitumen surface course per m²
Unit: m²
Quantity: 5,000
Rate: £22.00
Amount: £110,000
```

**Common Units:**
- m² (square meters - for surface area and pavement)
- m³ (cubic meters - for excavation, fill, materials)
- m (linear meters - for drainage, fencing)
- sum (lump sum for traffic features, preliminaries)

---

## How It Works

### Creating a BoQ

#### Step 1: Select Standard
Choose the appropriate standard based on project type:
- Building projects → **SMM7**
- Civil engineering → **CESMM**
- Healthcare facilities → **SHW**

#### Step 2: Choose Template or Start Fresh
**Using Templates (Recommended):**
- Browse pre-built templates in that standard
- Includes typical items, units, and structure
- Quick starting point with realistic pricing

**Custom BoQ:**
- Start from scratch
- Define sections manually
- Add items one by one

#### Step 3: Add Items
For each line item, specify:
- **Description:** Detailed scope of work
- **Unit:** How it's measured (m, m², m³, no, sum, etc.)
- **Quantity:** Total quantity needed
- **Rate:** Cost per unit
- **Amount:** Auto-calculated (Quantity × Rate)

**Example (SMM7 Building):**
| Item | Description | Unit | Qty | Rate | Amount |
|------|-------------|------|-----|------|--------|
| E.1.1 | Brickwork per m² | m² | 500 | £45 | £22,500 |
| H.1.2 | Roof tiles per m² | m² | 200 | £75 | £15,000 |
| K.2.1 | Supply and fix door per no | no | 8 | £850 | £6,800 |

#### Step 4: Add Contingency
- Typical range: 5-10% for well-defined projects
- 10-15% for early-stage estimates
- 15-20% for uncertain scope

#### Step 5: Review & Submit
- Validate all entries
- Export as PDF or CSV
- Submit for approval

### Measurement Standards Explained

#### SMM7 Measurement Principles

**Accuracy & Completeness:**
- Every item must be clearly identified
- Dimensions given to nearest 0.01m
- Unit rates must be all-inclusive

**Grouping:**
- Items grouped by type and location
- Related items listed consecutively
- Clear section breaks between major elements

**Description Format:**
```
[Element] [Type] [Specification] [Measurement basis]

Example: Reinforced concrete slab, 150mm thick, C25 concrete per m²
```

#### CESMM Measurement Principles

**Method of Measurement:**
- Different from SMM7 - adapted for civil engineering
- Focuses on site works, materials handling, and logistics
- Includes provisional sums for uncertain ground conditions

**Dayworks:**
- Can specify day rates for unforeseen work
- Separate section for labour and plant rates
- Useful for ground conditions changes

#### SHW Measurement Principles

**Highway Specific:**
- Focused on linear and areal measurement
- Quantities based on site conditions and existing surveys
- Includes preparation, removal, and surface treatment

**Provisional Sums:**
- Can include provisional sums for unforeseen items
- Ground conditions may affect excavation rates
- Traffic management costs often separate

**Environmental Provisions:**
- Waste disposal and environmental safeguards included
- Traffic management and safety provisions
- Working at height and near existing utilities

---

## Pre-built Templates

The system includes templates for common project types:

### SMM7 Templates
- **Residential Building:** Complete house/apartment construction
- **Building Extension:** Room extensions, conservatories
- **Office Fit-out:** Commercial interior finishing
- **Refurbishment:** Existing building upgrades

### CESMM Templates
- **Highway Works:** Road resurfacing, new construction
- **Bridge Construction:** Concrete/steel structures
- **Earthworks:** Excavation and filling projects
- **Drainage Project:** Sewer and water mains

### SHW Templates
- **Motorway Resurfacing:** Major trunk road resurfacing
- **Rural Road Construction:** New rural road or upgrade
- **Urban Street Works:** City street and traffic infrastructure
- **Parking Area Development:** Large parking facility construction

---

## BoQ Standard Features

### Column Calculations
- **Amount** = Quantity × Rate (auto-calculated)
- **Section Subtotal** = Sum of section items
- **Contingency** = Subtotal × Contingency %
- **Total** = Subtotal + Contingency

### Data Export
- **PDF:** Professional formatted document with title page
- **CSV:** For import to Excel or accounting software
- **Excel:** Editable spreadsheet format

### Validation
Automatic checks for:
- Missing descriptions
- Zero or negative quantities
- Invalid units
- Missing rates

### Approval Workflow
1. **Draft** - Being edited and updated
2. **Issued** - Sent to client/stakeholder
3. **Priced** - All rates confirmed
4. **Approved** - Final approved version

---

## Converting Between Standards

### Important Considerations

**Why Direct Conversion is Limited:**
- Each standard serves different purposes
- Different item groupings and terminology
- Different measurement approaches
- Different unit conventions

**What CAN Be Converted:**
- ✓ Quantities (with unit conversion: m → m², etc.)
- ✓ General descriptions mapped to relevant sections
- ✓ Cost bases adjusted for project type

**What REQUIRES Manual Mapping:**
- ✗ SMM7 items to CESMM (building items aren't civil items)
- ✗ CESMM to healthcare (civil doesn't map to medical)
- ✗ SHW to building (specialist functions differ)

### Conversion Process

1. Upload BoQ in source standard (CSV/Excel)
2. Select target standard
3. System attempts auto-mapping where possible
4. Manual review and adjustment recommended
5. Export in new standard

### Post-Conversion Steps

- Verify items make sense in new standard context
- Update rates for different project type
- Adjust quantities if units have changed
- Add project-specific items unique to new standard

---

## Best Practices

### Item Descriptions
✓ **Clear:** "Reinforced concrete slab 150mm thick, C25, per m²"
✗ **Vague:** "Concrete work"

✓ **Specific:** "Brickwork, 102.5mm single skin, perp joints, mortar, per m²"
✗ **Generic:** "All brickwork"

### Quantities
✓ **Measured:** 2,500 m² (measured from drawings)
✗ **Estimated:** "lots of"

✓ **Precise:** 4 doors (counted from schedule)
✗ **Approximate:** "around 3-5"

### Rates
✓ **Researched:** Based on current market rates, supplier quotes
✗ **Guessed:** Random figure

✓ **Inclusive:** Includes labour, plant, materials, overheads
✗ **Partial:** "Just materials"

### Contingency
✓ Well-defined projects: 5-10%
✓ Early estimates: 10-15%
✓ Uncertain scope: 15-20%
✓ Highly uncertain: 20%+

### Documentation
- Include notes on assumptions
- Document source of rates
- Reference drawings and specifications
- Date and version control

---

## Integration with Other Modules

### Sage 50 Integration
- Export approved BoQs to purchase orders
- Link BoQ items to supplier quotes
- Track actual costs vs estimated

### Project Accounting
- Use BoQ as project cost baseline
- Monitor progress billing against BoQ
- Track variations and claims

### Estimating Module
- Save BoQ as template for future projects
- Compare estimates across standards
- Build cost databases

---

## Technical Details

### File Formats Supported
- CSV (comma-separated values)
- XLSX (Microsoft Excel)
- PDF (read-only, for reference)

### Export Includes
- Company branding
- Project details
- All line items with calculations
- Summary page with totals
- Contingency breakdown

### Storage
- All BoQs versioned and timestamped
- Full audit trail of changes
- Approval signs-off preserved

---

## Future Enhancements

- [ ] Integration with cost planning databases
- [ ] Real-time rate updates from supplier feeds
- [ ] AI-assisted item description generation
- [ ] Automatic unit conversion with validation
- [ ] Cross-standard comparison reporting
- [ ] Tender analysis features
- [ ] BIM integration for quantity extraction
- [ ] Mobile app for site-based BoQ updates

---

## Support & Resources

### Learning Standards
- SMM7: RICS/BPF official publications
- CESMM: Institution of Civil Engineers
- SHW: Healthcare specific standards and guidelines

### Common Units Quick Reference

| Measurement | Unit | Usage |
|-------------|------|-------|
| Length | m | Linear measurements |
| Area | m² | Surface area (walls, floors, slab) |
| Volume | m³ | Excavation, concrete, fill |
| Number | no | Doors, windows, fittings |
| Number | nr | Alternative notation for number |
| Weight | t | Removal, materials |
| Lump Sum | sum | Preliminaries, complex items |

### Troubleshooting
- **Missing items:** Check section header - item may be in different section
- **Rate too high/low:** Validate against current market rates, adjust for project specifics
- **Conversion errors:** Manual review always recommended between standards
