import { useState, type FormEvent } from 'react'
import { inr, Pill } from '../ui'
import { useToast } from '../../context/ToastContext'
import type {
  ArchitecturalRequestStatus,
  DesignUpload,
  UserProfile,
} from '../../types'
import { useArchitecturalRequests } from '../../hooks/useArchitecturalRequests'

interface CustomerArchitectSectionProps {
  user: UserProfile
}

const statusToneMap: Record<ArchitecturalRequestStatus, 'amber' | 'blue' | 'green' | 'red'> = {
  Pending: 'amber',
  'Under Review': 'blue',
  Accepted: 'blue',
  'In Progress': 'blue',
  'Design Uploaded': 'green',
  Approved: 'green',
  'Revision Requested': 'amber',
  'More Info Needed': 'amber',
  Declined: 'red',
  Completed: 'green',
}

export default function CustomerArchitectSection({ user }: CustomerArchitectSectionProps) {
  const toast = useToast()
  const {
    requests,
    architects,
    loading,
    createRequest,
    updateStatus,
    requestRevision,
    sendMessage,
  } = useArchitecturalRequests(user)

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [previewDesign, setPreviewDesign] = useState<DesignUpload | null>(null)

  // Form states for New Request
  const [projectName, setProjectName] = useState('')
  const [selectedArchitectId, setSelectedArchitectId] = useState(architects[0]?.id || 'demo-architect')
  const [plotDimensions, setPlotDimensions] = useState('30 ft × 40 ft (1,200 sq.ft)')
  const [location, setLocation] = useState(user.city || 'Hyderabad')
  const [budget, setBudget] = useState('5500000')
  const [floors, setFloors] = useState(2)
  const [bedrooms, setBedrooms] = useState('3 BHK Duplex')
  const [designStyle, setDesignStyle] = useState('Modern Contemporary Vaastu')
  const [requirements, setRequirements] = useState(
    'East-facing entrance with Vaastu compliance. Need spacious ground-floor master suite with garden view, double-height living room, 1st floor home theatre, and cantilever balcony.'
  )
  const [submitting, setSubmitting] = useState(false)

  // Revision Form State
  const [revisionNotes, setRevisionNotes] = useState('')
  const [revisionSubmitting, setRevisionSubmitting] = useState(false)

  // Chat message state
  const [chatText, setChatText] = useState('')

  // Active request
  const activeRequest =
    requests.find((r) => r.id === selectedRequestId) || (requests.length > 0 ? requests[0] : null)

  // Submit New Request
  const handleCreateRequest = async (e: FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      toast('Please enter a project name', 'err')
      return
    }

    const arch = architects.find((a) => a.id === selectedArchitectId) || architects[0]
    setSubmitting(true)
    try {
      const created = await createRequest({
        architectId: arch.id,
        architectName: arch.name,
        projectName: projectName.trim(),
        plotDimensions: plotDimensions.trim(),
        location: location.trim(),
        budget: Number(budget) || 5000000,
        floors: Number(floors) || 2,
        bedrooms: bedrooms.trim(),
        designStyle: designStyle.trim(),
        requirements: requirements.trim(),
      })
      toast('Architectural design request submitted successfully!')
      setShowRequestModal(false)
      setSelectedRequestId(created.id)
      setProjectName('')
    } catch (err: any) {
      toast(err?.message || 'Failed to submit request', 'err')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Customer Approve Design
  const handleApproveDesign = async () => {
    if (!activeRequest) return
    try {
      await updateStatus(
        activeRequest.id,
        'Approved',
        'Customer approved the architectural design layout!'
      )
      toast('Design approved! Stamped blueprint is ready for municipal permit and construction.')
    } catch (err: any) {
      toast(err?.message || 'Failed to approve design', 'err')
    }
  }

  // Handle Submit Revision
  const handleSubmitRevision = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeRequest || !revisionNotes.trim()) return
    setRevisionSubmitting(true)
    try {
      await requestRevision(activeRequest.id, revisionNotes.trim())
      toast('Revision request sent to architect!')
      setShowRevisionModal(false)
      setRevisionNotes('')
    } catch (err: any) {
      toast(err?.message || 'Failed to submit revision', 'err')
    } finally {
      setRevisionSubmitting(false)
    }
  }

  // Handle Send Chat
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeRequest || !chatText.trim()) return
    const text = chatText
    setChatText('')
    try {
      await sendMessage(activeRequest.id, text)
    } catch (err: any) {
      setChatText(text)
      toast(err?.message || 'Failed to send message', 'err')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Architectural Design & Planning Requests</h2>
          <p className="text-sm text-slate-500">
            Request custom 2D floor plans, 3D elevations, review blueprints, and request design modifications.
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-orange-700 transition flex items-center gap-2"
        >
          <span>📐</span>
          <span>+ Request Architectural Design</span>
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading architectural projects…</p>}

      {!loading && requests.length === 0 && (
        <div className="card p-10 text-center space-y-4 border border-dashed border-slate-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
            📐
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">No Architectural Design Requests Yet</h3>
            <p className="mx-auto max-w-md text-sm text-slate-500 mt-1">
              Connect directly with verified licensed architects. Submit your plot size, floors, and Vaastu requirements to receive 2D floor plans and 3D elevations.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 shadow-md"
          >
            Create Your First Design Request
          </button>
        </div>
      )}

      {/* Main Grid: Request List Sidebar + Detailed Active Request */}
      {requests.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          {/* Requests Sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>My Design Requests ({requests.length})</span>
            </div>

            <div className="space-y-2">
              {requests.map((r) => {
                const isActive = (activeRequest?.id || '') === r.id
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRequestId(r.id)}
                    className={`card p-4 cursor-pointer transition ${
                      isActive
                        ? 'ring-2 ring-blue-600 border-blue-600 shadow-md bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-extrabold text-slate-900 text-sm">{r.projectName}</h4>
                      <Pill tone={statusToneMap[r.status] || 'amber'}>{r.status}</Pill>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Ar. {r.architectName} · {r.plotDimensions}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[0.7rem] text-slate-400">
                      <span>Budget: {inr(r.budget)}</span>
                      <span>{r.designs.length} Design(s)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detailed Request Workstation */}
          {activeRequest && (
            <div className="space-y-6">
              {/* Project Status Banner */}
              <div className="card p-5 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900">{activeRequest.projectName}</h3>
                      <Pill tone={statusToneMap[activeRequest.status]}>{activeRequest.status}</Pill>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Architect: <strong className="text-slate-800">{activeRequest.architectName}</strong> · Location: {activeRequest.location} · Plot: {activeRequest.plotDimensions}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {activeRequest.designs.length > 0 && activeRequest.status !== 'Approved' && (
                      <button
                        onClick={handleApproveDesign}
                        className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        ✓ Approve Final Design
                      </button>
                    )}
                    <button
                      onClick={() => setShowRevisionModal(true)}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                    >
                      ✏️ Request Modification
                    </button>
                  </div>
                </div>

                {/* Status Message Highlight */}
                {activeRequest.statusMessage && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-start gap-2">
                    <span className="text-base">ℹ️</span>
                    <div>
                      <strong className="block font-bold">Latest Update from Architect:</strong>
                      <span>{activeRequest.statusMessage}</span>
                    </div>
                  </div>
                )}

                {/* Project Specs Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Floors & Height</span>
                    <span className="font-bold text-slate-800">{activeRequest.floors} Floors</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Configuration</span>
                    <span className="font-bold text-slate-800">{activeRequest.bedrooms}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Design Style</span>
                    <span className="font-bold text-blue-700">{activeRequest.designStyle}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Budget Target</span>
                    <span className="font-bold text-emerald-700">{inr(activeRequest.budget)}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[0.65rem] block mb-1">
                    Your Requirements & Vaastu Guidelines:
                  </span>
                  <p className="rounded-lg bg-slate-100/70 p-2.5 italic">"{activeRequest.requirements}"</p>
                </div>
              </div>

              {/* Uploaded Designs Showcase */}
              <div className="card p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      Uploaded Architectural Blueprints & 3D Models
                    </h4>
                    <p className="text-xs text-slate-500">
                      {activeRequest.designs.length === 0
                        ? 'No designs uploaded yet by the architect.'
                        : `${activeRequest.designs.length} design drawing(s) available for inspection.`}
                    </p>
                  </div>
                </div>

                {activeRequest.designs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    Architect is currently drafting your floor plans. As soon as drawings are uploaded, you can view them here in 2D and 3D mode.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeRequest.designs.map((des) => (
                      <div
                        key={des.id}
                        className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white hover:border-blue-400 transition"
                      >
                        <div className="relative group">
                          <img
                            src={des.previewUrl}
                            alt={des.title}
                            className="h-44 w-full object-cover cursor-pointer group-hover:opacity-90 transition"
                            onClick={() => setPreviewDesign(des)}
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <span className="rounded-md bg-black/70 px-2 py-0.5 text-[0.65rem] font-bold text-white uppercase">
                              v{des.version}.0
                            </span>
                            <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                              {des.type}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-2 text-xs">
                          <h5 className="font-extrabold text-slate-900 text-sm line-clamp-1">{des.title}</h5>
                          <div className="grid grid-cols-2 gap-2 text-[0.7rem] text-slate-500">
                            <div>Concrete: <strong className="text-slate-700">{des.concreteMix || 'M25'}</strong></div>
                            <div>Steel: <strong className="text-slate-700">~{des.steelTonnes || 4.5} T</strong></div>
                          </div>
                          {des.structuralNotes && (
                            <p className="text-slate-600 line-clamp-2 text-[0.72rem] bg-slate-50 p-2 rounded">
                              {des.structuralNotes}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setPreviewDesign(des)}
                              className="font-bold text-blue-600 hover:underline"
                            >
                              🔍 Expand Drawing
                            </button>
                            <button
                              onClick={() => {
                                alert(`Downloaded high-resolution CAD & PDF package for "${des.title}"!`)
                              }}
                              className="rounded bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Download CAD / PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Revision History & Structural Inspection Tabs */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Revisions Tracking */}
                <div className="card p-5 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-sm">Modification & Revision History</h4>
                    <span className="text-xs font-bold text-slate-400">
                      {activeRequest.revisions.length} Revisions
                    </span>
                  </div>

                  {activeRequest.revisions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No revision requests submitted.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {activeRequest.revisions.map((rev) => (
                        <div key={rev.id} className="rounded-xl border border-slate-200 p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Revision #{rev.revisionNumber}</span>
                            <Pill tone={rev.status === 'Addressed' ? 'green' : 'amber'}>{rev.status}</Pill>
                          </div>
                          <p className="text-slate-600 italic">"{rev.notes}"</p>
                          {rev.architectResponse && (
                            <div className="mt-1 rounded bg-emerald-50 p-2 text-emerald-800 text-[0.7rem]">
                              <strong>Architect Response:</strong> {rev.architectResponse}
                            </div>
                          )}
                          <div className="text-[0.65rem] text-slate-400 pt-1">
                            Requested on: {rev.requestedAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Structural Site Inspection Audits */}
                <div className="card p-5 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-sm">Structural Inspection Audits</h4>
                    <span className="text-xs font-bold text-emerald-600">
                      {activeRequest.inspections.length} Certified
                    </span>
                  </div>

                  {activeRequest.inspections.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Site inspections will appear here once construction begins and the architect conducts on-site structural audits.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {activeRequest.inspections.map((insp) => (
                        <div key={insp.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{insp.title}</span>
                            <Pill tone="green">{insp.status}</Pill>
                          </div>
                          <div className="text-[0.7rem] text-slate-500">Stage: {insp.stage} · {insp.date}</div>
                          <p className="text-slate-700 text-[0.72rem]">{insp.findings}</p>
                          <div className="text-[0.65rem] text-slate-400 pt-1">Certified by: {insp.certifiedBy}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Communication / Messaging Panel with Architect */}
              <div className="card p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Direct Project Chat with Ar. {activeRequest.architectName}
                  </h4>
                  <span className="text-xs text-slate-400">Real-Time Messaging</span>
                </div>

                <div className="h-64 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 overflow-y-auto text-xs">
                  {activeRequest.messages.length === 0 ? (
                    <p className="text-center text-slate-400 py-10">No messages exchanged yet. Send a message below.</p>
                  ) : (
                    activeRequest.messages.map((m) => {
                      const mine = m.senderId === user.uid || m.senderRole === 'Customer'
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                              mine
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`font-bold text-[0.7rem] ${mine ? 'text-blue-200' : 'text-slate-500'}`}>
                                {m.senderName} ({m.senderRole})
                              </span>
                              <span className={`text-[0.6rem] ${mine ? 'text-blue-200' : 'text-slate-400'}`}>
                                {m.timestamp}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    className="inp text-xs"
                    placeholder={`Message Ar. ${activeRequest.architectName} regarding floor layout, materials, or Vaastu...`}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!chatText.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Request Architectural Design */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl p-6 space-y-4 text-xs font-semibold my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Request Architectural Design & 2D/3D Plans</h3>
                <p className="text-slate-500 text-[0.75rem] font-normal">
                  Provide your plot and residential details for customized AutoCAD layouts & elevations.
                </p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-black text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5">
              <label className="block">
                Project Name *
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. Lotus Villa 3BHK Duplex, Green Meadows Residence"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </label>

              <label className="block">
                Select Licensed Architect *
                <select
                  className="inp mt-1 text-xs"
                  value={selectedArchitectId}
                  onChange={(e) => setSelectedArchitectId(e.target.value)}
                >
                  {architects.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.qualifications}) · {a.city} · ★ {a.rating} ({a.projectsCount} Projects)
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  Plot Dimensions *
                  <input
                    required
                    className="inp mt-1 text-xs"
                    placeholder="e.g. 30 ft × 40 ft (1,200 sq.ft)"
                    value={plotDimensions}
                    onChange={(e) => setPlotDimensions(e.target.value)}
                  />
                </label>
                <label className="block">
                  Site Location (City / Area) *
                  <input
                    required
                    className="inp mt-1 text-xs"
                    placeholder="e.g. Jubilee Hills, Hyderabad"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  Target Budget (₹)
                  <input
                    type="number"
                    className="inp mt-1 text-xs"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </label>
                <label className="block">
                  Number of Floors
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="inp mt-1 text-xs"
                    value={floors}
                    onChange={(e) => setFloors(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  Room Configuration
                  <input
                    className="inp mt-1 text-xs"
                    placeholder="e.g. 3 BHK Duplex"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                  />
                </label>
              </div>

              <label className="block">
                Preferred Architectural Style
                <select
                  className="inp mt-1 text-xs"
                  value={designStyle}
                  onChange={(e) => setDesignStyle(e.target.value)}
                >
                  <option value="Modern Contemporary Vaastu">Modern Contemporary Vaastu</option>
                  <option value="Minimalist European">Minimalist European</option>
                  <option value="Traditional Indian / Chettinad">Traditional Indian / Chettinad</option>
                  <option value="Luxury Cantilever Villa">Luxury Cantilever Villa</option>
                  <option value="Neo-Classical Colonial">Neo-Classical Colonial</option>
                  <option value="Eco-Friendly Sustainable Solar">Eco-Friendly Sustainable Solar</option>
                </select>
              </label>

              <label className="block">
                Specific Requirements & Vaastu Preferences
                <textarea
                  rows={3}
                  className="inp mt-1 text-xs"
                  placeholder="e.g. Northeast pooja room, double car parking, open-to-sky courtyard, large balcony..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </label>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn flex-1 py-2 text-xs !bg-orange-600 hover:!bg-orange-700"
                >
                  {submitting ? 'Submitting…' : 'Submit Architectural Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn2 !bg-slate-200 !text-slate-800 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Modification / Revision */}
      {showRevisionModal && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-extrabold text-slate-900">Request Design Revision</h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitRevision} className="space-y-3">
              <p className="text-slate-600 font-normal">
                Specify what changes you would like Ar. {activeRequest.architectName} to make in the 2D floor plans or 3D elevations.
              </p>
              <label className="block">
                Revision Details & Modification Notes *
                <textarea
                  required
                  rows={4}
                  className="inp mt-1 text-xs"
                  placeholder="e.g. Please widen the kitchen utility area by 2 feet, move the staircase to the southwest side, and increase balcony depth..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                />
              </label>
              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  disabled={revisionSubmitting}
                  className="btn flex-1 py-2 text-xs !bg-amber-600 hover:!bg-amber-700"
                >
                  {revisionSubmitting ? 'Sending…' : 'Send Revision Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="btn2 !bg-slate-200 !text-slate-800 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: High-Resolution Design Preview */}
      {previewDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="card w-full max-w-3xl p-6 space-y-4 text-xs font-semibold max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{previewDesign.title}</h3>
                <span className="text-slate-500 text-[0.7rem] font-normal">
                  {previewDesign.type} · Version {previewDesign.version}.0 · Uploaded on {previewDesign.uploadedAt}
                </span>
              </div>
              <button onClick={() => setPreviewDesign(null)} className="text-slate-400 hover:text-black text-lg">
                ✕
              </button>
            </div>

            <img
              src={previewDesign.previewUrl}
              alt={previewDesign.title}
              className="w-full max-h-[480px] object-contain rounded-xl bg-slate-900"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-slate-700 text-xs">
              <div>Dimensions: <strong className="block text-slate-900">{previewDesign.dimensions || '30x40 ft'}</strong></div>
              <div>Floors: <strong className="block text-slate-900">{previewDesign.floors || 'G+1'}</strong></div>
              <div>Concrete Mix: <strong className="block text-blue-600">{previewDesign.concreteMix || 'M25'}</strong></div>
              <div>Steel Takeoff: <strong className="block text-emerald-700">~{previewDesign.steelTonnes || 4.8} Tonnes</strong></div>
            </div>

            <div className="rounded-lg bg-blue-50/70 p-3 text-xs text-blue-900">
              <strong>Architect's Structural Notes:</strong>
              <p className="mt-1 font-normal">{previewDesign.structuralNotes}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => alert(`Downloaded high-res file for ${previewDesign.title}!`)}
                className="btn2 text-xs"
              >
                Download Drawing
              </button>
              <button
                onClick={() => setPreviewDesign(null)}
                className="btn2 !bg-slate-200 !text-slate-800 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
