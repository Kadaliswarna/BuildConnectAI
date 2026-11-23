import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../components/ui'
import { useI18n } from '../lib/i18n'

type ResultEvent = { results: { [i: number]: { transcript: string } }; resultIndex: number }
type Recognition = { lang: string; interimResults: boolean; onresult: ((event: ResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void }
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }

const copy = {
  en: { title: 'Voice and language assistant', intro: 'Use your browser’s speech recognition and speech synthesis for simple navigation and short guidance. This is not an AI conversation service.', listen: 'Start voice input', stop: 'Stop listening', speak: 'Read guidance aloud', ready: 'Try saying “open estimator”, “track my project”, “find workers” or “show materials”.', unsupported: 'Voice input is not available in this browser. You can still use the written guide and navigation buttons.', guide: 'Choose a section below. Voice recognition and voices depend on browser and device language support.', projects: 'Open project tracking', estimate: 'Open cost estimator', workers: 'Find workers', materials: 'View materials',
    response: 'I can help you open project tracking, estimate a construction budget, find workers, or review material guidance. For emergency help in India, call 112.' },
  te: { title: 'వాయిస్ మరియు భాష సహాయకుడు', intro: 'సులభమైన నావిగేషన్ మరియు చిన్న సూచనల కోసం మీ బ్రౌజర్ వాయిస్ గుర్తింపు, మాటలను ఉపయోగించండి. ఇది AI సంభాషణ సేవ కాదు.', listen: 'వాయిస్ ఇన్‌పుట్ ప్రారంభించండి', stop: 'వినడం ఆపండి', speak: 'సూచనలను వినండి', ready: '“ఖర్చు అంచనా”, “నా ప్రాజెక్ట్”, “కార్మికులు” లేదా “మెటీరియల్స్” అని చెప్పండి.', unsupported: 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు. వ్రాత మార్గదర్శిని ఉపయోగించండి.', guide: 'క్రింది విభాగాన్ని ఎంచుకోండి. వాయిస్ మద్దతు బ్రౌజర్ మరియు పరికరంపై ఆధారపడి ఉంటుంది.', projects: 'ప్రాజెక్ట్ ట్రాకింగ్', estimate: 'ఖర్చు అంచనా', workers: 'కార్మికులను కనుగొనండి', materials: 'మెటీరియల్ సమాచారం', response: 'ప్రాజెక్ట్ ట్రాకింగ్, నిర్మాణ ఖర్చు అంచనా, కార్మికుల కోసం శోధన లేదా మెటీరియల్ మార్గదర్శిని తెరవగలను. భారతదేశంలో అత్యవసర సహాయం కోసం 112కు కాల్ చేయండి.' },
  hi: { title: 'आवाज़ और भाषा सहायक', intro: 'आसान नेविगेशन और छोटे निर्देशों के लिए अपने ब्राउज़र की आवाज़ पहचान और वाणी सुविधा का उपयोग करें। यह AI बातचीत सेवा नहीं है।', listen: 'आवाज़ इनपुट शुरू करें', stop: 'सुनना रोकें', speak: 'निर्देश सुनें', ready: '“लागत अनुमान”, “मेरा प्रोजेक्ट”, “कारीगर” या “सामग्री” कहकर देखें।', unsupported: 'इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। लिखित मार्गदर्शिका और नेविगेशन बटन उपलब्ध हैं।', guide: 'नीचे कोई अनुभाग चुनें। आवाज़ की सुविधा ब्राउज़र और डिवाइस पर निर्भर करती है।', projects: 'प्रोजेक्ट ट्रैकिंग', estimate: 'लागत अनुमान', workers: 'कारीगर खोजें', materials: 'सामग्री जानकारी', response: 'मैं प्रोजेक्ट ट्रैकिंग, निर्माण लागत अनुमान, कारीगर खोजने या सामग्री मार्गदर्शन खोल सकता हूँ। भारत में आपातकाल के लिए 112 पर कॉल करें।' },
}

export default function Assistant() {
  const { lang } = useI18n(); const t = copy[lang]; const nav = useNavigate(); const recognition = useRef<Recognition | null>(null)
  const [listening, setListening] = useState(false); const [heard, setHeard] = useState(''); const [answer, setAnswer] = useState(t.ready)
  const Constructor = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition
  const speak = (text: string) => { setAnswer(text); if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'; window.speechSynthesis.speak(utterance) } }
  const start = () => {
    if (!Constructor) return
    const rec = new Constructor(); recognition.current = rec; rec.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'; rec.interimResults = false
    rec.onresult = (event) => { const phrase = event.results[event.resultIndex]?.transcript ?? ''; setHeard(phrase); const v = phrase.toLowerCase()
      if (v.includes('estimate') || v.includes('cost') || v.includes('ఖర్చు') || v.includes('लागत')) { nav('/estimator'); speak(t.estimate) }
      else if (v.includes('track') || v.includes('project') || v.includes('ప్రాజెక్ట్') || v.includes('प्रोजेक्ट')) { nav('/track'); speak(t.projects) }
      else if (v.includes('worker') || v.includes('కార్మిక') || v.includes('कारीगर')) { nav('/workers'); speak(t.workers) }
      else if (v.includes('material') || v.includes('మెటీరియల్') || v.includes('सामग्री')) { nav('/materials'); speak(t.materials) }
      else speak(t.response)
    }
    rec.onerror = () => { setListening(false); setAnswer('Voice input failed. Check microphone permission and try again.') }; rec.onend = () => setListening(false)
    try { rec.start(); setListening(true) } catch { setListening(false); setAnswer('Voice input could not start. Try again.') }
  }
  const routes = [['/track', t.projects], ['/estimator', t.estimate], ['/workers', t.workers], ['/materials', t.materials]]
  return <PageShell title={t.title} subtitle={t.intro}>
    <section className="card mx-auto max-w-3xl p-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 text-slate-900 dark:bg-navy dark:border-transparent dark:text-white p-6 shadow-xs">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-100">{listening ? t.stop : t.ready}</p>
        <p className="mt-3 text-xl font-bold text-slate-900 dark:text-white" aria-live="polite">{answer}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn" onClick={() => listening ? recognition.current?.stop() : start()} disabled={!Constructor}>{listening ? t.stop : t.listen}</button>
          <button className="ghost border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => speak(t.response)}>{t.speak}</button>
        </div>
      </div>
      {!Constructor && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t.unsupported}</p>}
      {heard && <p className="mt-3 text-sm text-slate-500">Heard: “{heard}”</p>}
      <h2 className="mt-6 font-extrabold text-slate-900 dark:text-white">{t.guide}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {routes.map(([path, label]) => <button key={path} className="btn2 text-left" onClick={() => nav(path)}>{label} →</button>)}
      </div>
    </section>
  </PageShell>
}
