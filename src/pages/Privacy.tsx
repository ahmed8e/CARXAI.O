import Navbar from '../components/Navbar'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6">
      <Navbar />
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[32px] border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-6">Privacy Policy</h1>
        <p className="text-slate-500 mb-4">Last updated: March 31, 2026</p>
        
        <div className="space-y-6 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, submit a vehicle diagnostic request, upload photos, or communicate with us.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our AI diagnostic services, to process transactions, and to send you technical notices and support messages.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet is 100% secure.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
