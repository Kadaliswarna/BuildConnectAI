// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import {
  createArchitecturalRequest,
  getStoredArchitecturalRequests,
  updateArchitecturalRequestStatus,
  uploadDesignToRequest,
  submitDesignRevision,
  respondToDesignRevision,
  sendRequestMessage,
  addInspectionRecord,
} from './lib/architecturalData'
import type { UserProfile } from './types'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('Customer–Architect Integration Workflow', () => {
  const mockCustomer: UserProfile = {
    uid: 'test-cust-123',
    name: 'Suresh Kumar',
    email: 'suresh@test.com',
    role: 'Customer',
    city: 'Hyderabad',
    phone: '+91 98765 11111',
  }

  const mockArchitect: UserProfile = {
    uid: 'demo-architect',
    name: 'Ar. Priya Sharma',
    email: 'architect@gmail.com',
    role: 'Architect / Engineer',
    city: 'Hyderabad',
    phone: '+91 98765 43214',
    coaReg: 'CA/2018/98421',
    qualifications: 'B.Arch (SPA), M.Tech (Structural)',
    experienceYears: 11,
    specialization: 'Vaastu Duplexes',
  }

  it('1. Customer submits a design request and it appears in the shared database', async () => {
    const newReq = await createArchitecturalRequest({
      customerId: mockCustomer.uid,
      customerName: mockCustomer.name,
      customerEmail: mockCustomer.email,
      customerPhone: mockCustomer.phone,
      architectId: mockArchitect.uid,
      architectName: mockArchitect.name,
      projectName: 'Green Meadows Luxury Villa',
      plotDimensions: '40 ft × 60 ft (2,400 sq.ft)',
      location: 'Gachibowli, Hyderabad',
      budget: 8500000,
      floors: 3,
      bedrooms: '4 BHK Duplex',
      designStyle: 'Luxury Villa',
      requirements: 'North-East entrance, double-car parking, home theatre and cantilever balcony.',
    })

    expect(newReq.id).toBeTruthy()
    expect(newReq.status).toBe('Pending')
    expect(newReq.projectName).toBe('Green Meadows Luxury Villa')

    // Verify stored requests contain this request
    const all = getStoredArchitecturalRequests()
    const found = all.find((r) => r.id === newReq.id)
    expect(found).toBeDefined()
    expect(found?.customerName).toBe('Suresh Kumar')
    expect(found?.architectId).toBe('demo-architect')
    expect(found?.budget).toBe(8500000)
  })

  it('2. Architect accepts the request and updates status', async () => {
    const newReq = await createArchitecturalRequest({
      customerId: mockCustomer.uid,
      customerName: mockCustomer.name,
      customerEmail: mockCustomer.email,
      customerPhone: mockCustomer.phone,
      architectId: mockArchitect.uid,
      architectName: mockArchitect.name,
      projectName: 'Sunrise Heights Villa',
      plotDimensions: '30 ft × 50 ft',
      location: 'Hyderabad',
      budget: 6000000,
      floors: 2,
      bedrooms: '3 BHK',
      designStyle: 'Modern Contemporary',
      requirements: 'Open courtyard',
    })

    await updateArchitecturalRequestStatus(
      newReq.id,
      'Accepted',
      'Ar. Priya accepted your design brief.',
      { id: mockArchitect.uid, name: mockArchitect.name, role: mockArchitect.role }
    )

    const all = getStoredArchitecturalRequests()
    const updated = all.find((r) => r.id === newReq.id)
    expect(updated?.status).toBe('Accepted')
    expect(updated?.statusMessage).toContain('Ar. Priya accepted')
  })

  it('3. Architect uploads 2D floor plan drawing and customer receives it', async () => {
    const newReq = await createArchitecturalRequest({
      customerId: mockCustomer.uid,
      customerName: mockCustomer.name,
      customerEmail: mockCustomer.email,
      customerPhone: mockCustomer.phone,
      architectId: mockArchitect.uid,
      architectName: mockArchitect.name,
      projectName: 'Lakeview Duplex',
      plotDimensions: '30x40 ft',
      location: 'Hyderabad',
      budget: 5000000,
      floors: 2,
      bedrooms: '3 BHK',
      designStyle: 'Modern',
      requirements: 'Vaastu East',
    })

    await uploadDesignToRequest(newReq.id, {
      title: '30x40 G+1 Detailed CAD Layout',
      type: '2D Floor Plan',
      previewUrl: 'https://example.com/plan.jpg',
      dimensions: '30x40 ft',
      floors: 'G+1',
      rooms: '3 BHK Duplex',
      concreteMix: 'M25 (1 : 1 : 2)',
      steelTonnes: 5.2,
      structuralNotes: 'M25 grade RCC columns with 16mm Fe550D TMT bars.',
    })

    const all = getStoredArchitecturalRequests()
    const updated = all.find((r) => r.id === newReq.id)
    expect(updated?.status).toBe('Design Uploaded')
    expect(updated?.designs.length).toBe(1)
    expect(updated?.designs[0].title).toBe('30x40 G+1 Detailed CAD Layout')
    expect(updated?.designs[0].concreteMix).toBe('M25 (1 : 1 : 2)')
    expect(updated?.designs[0].steelTonnes).toBe(5.2)
  })

  it('4. Customer requests revision and architect responds', async () => {
    const newReq = await createArchitecturalRequest({
      customerId: mockCustomer.uid,
      customerName: mockCustomer.name,
      customerEmail: mockCustomer.email,
      customerPhone: mockCustomer.phone,
      architectId: mockArchitect.uid,
      architectName: mockArchitect.name,
      projectName: 'Palm View Residence',
      plotDimensions: '35x50 ft',
      location: 'Hyderabad',
      budget: 7000000,
      floors: 2,
      bedrooms: '4 BHK',
      designStyle: 'Traditional Vaastu',
      requirements: 'Large pooja room',
    })

    // Customer requests modification
    await submitDesignRevision(
      newReq.id,
      mockCustomer,
      'Please widen the master bedroom and shift the puja room northeast.'
    )

    let all = getStoredArchitecturalRequests()
    let req = all.find((r) => r.id === newReq.id)
    expect(req?.status).toBe('Revision Requested')
    expect(req?.revisions.length).toBe(1)
    expect(req?.revisions[0].notes).toContain('shift the puja room')
    expect(req?.revisions[0].status).toBe('Open')

    // Architect responds to modification
    const revId = req!.revisions[0].id
    await respondToDesignRevision(
      newReq.id,
      revId,
      mockArchitect,
      'Adjusted in layout v1.1. Puja room aligned with Ishanya corner.'
    )

    all = getStoredArchitecturalRequests()
    req = all.find((r) => r.id === newReq.id)
    expect(req?.status).toBe('In Progress')
    expect(req?.revisions[0].status).toBe('Addressed')
    expect(req?.revisions[0].architectResponse).toContain('Puja room aligned with Ishanya corner')
  })

  it('5. Customer approves final design', async () => {
    const newReq = await createArchitecturalRequest({
      customerId: mockCustomer.uid,
      customerName: mockCustomer.name,
      customerEmail: mockCustomer.email,
      customerPhone: mockCustomer.phone,
      architectId: mockArchitect.uid,
      architectName: mockArchitect.name,
      projectName: 'Approved Villa',
      plotDimensions: '30x40',
      location: 'Hyderabad',
      budget: 4500000,
      floors: 2,
      bedrooms: '3 BHK',
      designStyle: 'Modern',
      requirements: 'Standard',
    })

    await updateArchitecturalRequestStatus(
      newReq.id,
      'Approved',
      'Customer approved the architectural design layout!'
    )

    const all = getStoredArchitecturalRequests()
    const found = all.find((r) => r.id === newReq.id)
    expect(found?.status).toBe('Approved')
  })

  it('6. Real-time message exchange between customer and architect', async () => {
    const newReq = await createArchitecturalRequest({
      customerId: mockCustomer.uid,
      customerName: mockCustomer.name,
      customerEmail: mockCustomer.email,
      customerPhone: mockCustomer.phone,
      architectId: mockArchitect.uid,
      architectName: mockArchitect.name,
      projectName: 'Chat Test Project',
      plotDimensions: '30x40',
      location: 'Hyderabad',
      budget: 4000000,
      floors: 2,
      bedrooms: '3 BHK',
      designStyle: 'Contemporary',
      requirements: 'Double car porch',
    })

    // Customer sends message
    await sendRequestMessage(newReq.id, mockCustomer, 'Can you verify municipal setback requirements?')

    // Architect replies
    await sendRequestMessage(
      newReq.id,
      mockArchitect,
      'Yes! Required front setback is 3.0m and sides 1.5m as per GHMC building bylaws.'
    )

    const all = getStoredArchitecturalRequests()
    const req = all.find((r) => r.id === newReq.id)
    expect(req?.messages.length).toBeGreaterThanOrEqual(3) // initial + 2 new
    expect(req?.messages.some((m) => m.text.includes('municipal setback'))).toBe(true)
    expect(req?.messages.some((m) => m.text.includes('GHMC building bylaws'))).toBe(true)
  })

  it('7. Structural site inspection recording', async () => {
    const newReq = await createArchitecturalRequest({
      customerId: mockCustomer.uid,
      customerName: mockCustomer.name,
      customerEmail: mockCustomer.email,
      customerPhone: mockCustomer.phone,
      architectId: mockArchitect.uid,
      architectName: mockArchitect.name,
      projectName: 'Inspection Villa',
      plotDimensions: '40x60',
      location: 'Hyderabad',
      budget: 7500000,
      floors: 2,
      bedrooms: '4 BHK',
      designStyle: 'Villa',
      requirements: 'RCC Frame',
    })

    await addInspectionRecord(newReq.id, {
      title: 'Plinth Beam & Footing Rebar Inspection',
      stage: 'Foundation & Plinth',
      date: '2026-11-21',
      status: 'Passed',
      rebarSpacing: '150 mm c/c',
      concreteSlump: '100 mm slump',
      coverBlocks: '40 mm clear cover',
      curingPeriod: '14 days',
      findings: 'All starter columns verified with seismic ties at 135-degree hooks.',
      certifiedBy: 'Ar. Priya Sharma (COA Reg: CA/2018/98421)',
    })

    const all = getStoredArchitecturalRequests()
    const req = all.find((r) => r.id === newReq.id)
    expect(req?.inspections.length).toBe(1)
    expect(req?.inspections[0].title).toBe('Plinth Beam & Footing Rebar Inspection')
    expect(req?.inspections[0].status).toBe('Passed')
  })
})
