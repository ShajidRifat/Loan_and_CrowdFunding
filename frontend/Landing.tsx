import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { 
  ArrowRight, Check, Heart, ShieldCheck, Users, TrendingUp, 
  UserPlus, FileCheck, Wallet, GraduationCap, Star
} from 'lucide-react';

export default function Landing() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="fade-in">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-brand-100 text-brand-600 text-sm font-medium mb-8 shadow-sm stagger-1">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Bangladesh's First Merit-Based Funding Platform
              </div>
              <h1 className="font-display text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight stagger-2">
                Your Talent, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-secondary">Our Capital.</span>
              </h1>
              <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg stagger-3">
                Loan & CrowdFunding connects brilliant students with alumni investors. No collateral needed—just your CGPA and potential.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 stagger-4">
                <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 hover:-translate-y-1 text-lg text-center flex items-center justify-center gap-2 btn-ripple">
                  Apply for Funding <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-slate-700 font-bold rounded-xl border border-slate-200 transition-all hover:border-brand-200 hover:-translate-y-1 text-lg text-center backdrop-blur-sm">
                  Learn More
                </a>
              </div>

              <div className="mt-12 flex items-center gap-4 text-sm text-slate-500 stagger-4">
                <div className="flex -space-x-2">
                  <img className="w-8 h-8 rounded-full border-2 border-white" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahim" alt="User" />
                  <img className="w-8 h-8 rounded-full border-2 border-white" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fatema" alt="User" />
                  <img className="w-8 h-8 rounded-full border-2 border-white" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Karim" alt="User" />
                </div>
                <p>Trusted by <span className="font-bold text-slate-900">5,000+</span> students from UIU, BUET, DU, & NSU</p>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative lg:h-[600px] flex items-center justify-center slide-in-right">
              {/* Floating Cards */}
              <div className="absolute top-10 right-10 z-20 float delay-100">
                <div className="glass-card p-4 rounded-2xl flex items-center gap-3 w-64 tilt-card bg-white/80 backdrop-blur border border-white">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Tuition Funded</div>
                    <div className="text-slate-900 font-bold">৳50,000</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 left-0 z-20 float delay-300">
                <div className="glass-card p-4 rounded-2xl flex items-center gap-3 w-64 tilt-card bg-white/80 backdrop-blur border border-white">
                  <div className="h-10 w-10 bg-accent-100 rounded-full flex items-center justify-center text-accent-500">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">New Donation</div>
                    <div className="text-slate-900 font-bold">+৳5,000</div>
                  </div>
                </div>
              </div>

              {/* Main Graphic */}
              <div className="relative z-10 w-full max-w-md aspect-square bg-gradient-to-tr from-brand-500 to-secondary rounded-full opacity-20 blur-3xl animate-pulse"></div>
              <img src="https://illustrations.popsy.co/amber/student-going-to-school.svg" alt="Student Success" className="absolute z-10 w-full max-w-lg drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">Why Choose Loan & CrowdFunding?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">We're building a financial ecosystem that puts Bangladeshi students first.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl tilt-card border border-white/50">
              <div className="h-14 w-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-6 text-brand-600 shadow-sm">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-3">Merit-Based Trust</h3>
              <p className="text-slate-500 leading-relaxed">Our AI analyzes your CGPA and university standing to approve loans. No family collateral required.</p>
            </div>
            <div className="glass p-8 rounded-3xl tilt-card border border-white/50">
              <div className="h-14 w-14 bg-accent-100 rounded-2xl flex items-center justify-center mb-6 text-accent-600 shadow-sm">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-3">Community Funded</h3>
              <p className="text-slate-500 leading-relaxed">Crowdfund your projects or tuition directly from a network of successful alumni and donors.</p>
            </div>
            <div className="glass p-8 rounded-3xl tilt-card border border-white/50">
              <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600 shadow-sm">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-3">Shariah Compliant</h3>
              <p className="text-slate-500 leading-relaxed">We offer interest-free (Qard Hasan) options and profit-sharing models for ethical financing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Four simple steps to secure your future.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>
            
            <div className="relative group">
              <div className="bg-white w-24 h-24 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 text-center mb-2">1. Create Profile</h3>
              <p className="text-slate-500 text-center text-sm">Sign up and verify your student status with your university ID.</p>
            </div>

            <div className="relative group">
              <div className="bg-white w-24 h-24 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <FileCheck className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 text-center mb-2">2. Get Verified</h3>
              <p className="text-slate-500 text-center text-sm">Our AI analyzes your academic performance to assign a Trust Score.</p>
            </div>

            <div className="relative group">
              <div className="bg-white w-24 h-24 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                <div className="h-12 w-12 bg-accent-100 rounded-xl flex items-center justify-center text-accent-600">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 text-center mb-2">3. Receive Funds</h3>
              <p className="text-slate-500 text-center text-sm">Apply for a loan or start a campaign. Funds are disbursed directly.</p>
            </div>

            <div className="relative group">
              <div className="bg-white w-24 h-24 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 text-center mb-2">4. Repay & Grow</h3>
              <p className="text-slate-500 text-center text-sm">Repay after graduation or as agreed. Build your credit history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">Empowering the Next Generation of Leaders</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                We believe that financial constraints should never stand in the way of education. By connecting students with alumni and investors, we're creating a sustainable cycle of success.
              </p>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-bold text-brand-400 mb-1">৳50M+</div>
                  <div className="text-sm text-slate-400">Total Funds Disbursed</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-400 mb-1">10k+</div>
                  <div className="text-sm text-slate-400">Students Supported</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-400 mb-1">98%</div>
                  <div className="text-sm text-slate-400">Repayment Rate</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-accent-400 mb-1">50+</div>
                  <div className="text-sm text-slate-400">Partner Universities</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000" alt="Students" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
                  <div>
                    <div className="font-bold text-xl mb-1">"Loan & CrowdFunding saved my semester."</div>
                    <div className="text-slate-300 text-sm">- Robin, CS Student at UIU</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">Success Stories</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Hear from the students and investors shaping the future.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 text-accent-500 mb-6">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">"The application process was incredibly smooth. I got funded within 3 days and could pay my tuition on time. The repayment terms are very student-friendly."</p>
              <div className="flex items-center gap-4">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahim" className="h-12 w-12 rounded-full bg-white" alt="User" />
                <div>
                  <div className="font-bold text-slate-900">Sujon Das</div>
                  <div className="text-xs text-slate-500">Student, UIU</div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 text-accent-500 mb-6">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">"As an alumni, I wanted to give back. Loan & CrowdFunding allows me to see exactly who I'm helping and track their progress. It's transparent and impactful."</p>
              <div className="flex items-center gap-4">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvir" className="h-12 w-12 rounded-full bg-white" alt="User" />
                <div>
                  <div className="font-bold text-slate-900">Tanvir Ahmed</div>
                  <div className="text-xs text-slate-500">Investor, Ex-NSU</div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 text-accent-500 mb-6">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">"I raised funds for my final year project through the crowdfunding feature. The community support was overwhelming. Highly recommended!"</p>
              <div className="flex items-center gap-4">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fatema" className="h-12 w-12 rounded-full bg-white" alt="User" />
                <div>
                  <div className="font-bold text-slate-900">Fatema Begum</div>
                  <div className="text-xs text-slate-500">Student, DU</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Who is eligible to apply?</h3>
              <p className="text-slate-600">Any undergraduate or graduate student enrolled in a recognized Bangladeshi university with a valid student ID and a minimum CGPA of 3.5.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 mb-2">What is the interest rate?</h3>
              <p className="text-slate-600">We offer 0% interest loans (Qard Hasan) for eligible students. For larger amounts, we use a profit-sharing model where you share a small percentage of future earnings.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 mb-2">How do I repay the loan?</h3>
              <p className="text-slate-600">Repayment starts 6 months after graduation or when you secure employment. You can choose a flexible monthly installment plan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200/60 bg-white/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                <path d="M10 28V16L20 24L30 16V28" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-slate-900">Loan & CrowdFunding</span>
          </div>
          <div className="text-slate-500 text-sm">
            &copy; 2026 Loan & CrowdFunding Bangladesh. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors">FB</a>
            <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors">TW</a>
            <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors">LI</a>
          </div>
        </div>
      </footer>
    </>
  );
}
