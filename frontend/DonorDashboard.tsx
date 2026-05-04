import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiCall, auth, formatCurrency } from '../lib/utils';
import { 
  Heart, Users, GraduationCap, ArrowRight, Download 
} from 'lucide-react';

export default function DonorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const user = auth.getUser();
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'donor') { navigate('/dashboard'); return; }

        const result = await apiCall(`api/dashboard/donor.php`);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const donations = data?.donations || [];
  const campaigns = data?.recommended_campaigns || [];
  const transactions = data?.recent_transactions || [];
  const stats = data?.stats || { total_donated: 0, lives_impacted: 0, campaigns_supported: 0 };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto"
      >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <Heart className="h-24 w-24" />
                  </div>
                  <div className="relative z-10">
                      <p className="text-brand-100 font-medium mb-1">Total Donated</p>
                      <h2 className="text-4xl font-display font-bold mb-2">{formatCurrency(stats.total_donated)}</h2>
                      <p className="text-xs text-brand-200 bg-white/20 inline-block px-2 py-1 rounded">Lifetime Contribution</p>
                  </div>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand-300 transition-colors">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-slate-900 mb-1">{stats.lives_impacted}</h2>
                  <p className="text-sm text-slate-500">Lives Impacted</p>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand-300 transition-colors">
                  <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-slate-900 mb-1">{stats.campaigns_supported}</h2>
                  <p className="text-sm text-slate-500">Campaigns Supported</p>
              </motion.div>
          </div>

          <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-display font-bold text-slate-900">Smart Recommendations</h3>
                  <button onClick={() => navigate('/campaign-marketplace')} className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                      View Marketplace <ArrowRight className="h-4 w-4" />
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.length > 0 ? campaigns.map((camp: any, idx: number) => {
                      const progress = Math.min(100, (parseFloat(camp.raised_amount) / parseFloat(camp.goal_amount)) * 100);
                      return (
                          <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                              <div className="h-32 bg-slate-100 relative">
                                  {camp.image_url ? (
                                      <img src={camp.image_url} alt="Campaign" className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="absolute inset-0 flex items-center justify-center text-slate-300"><GraduationCap className="h-12 w-12" /></div>
                                  )}
                                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg text-brand-700">Matched</div>
                              </div>
                              <div className="p-5 flex-1 flex flex-col">
                                  <h4 className="font-bold text-slate-900 mb-1">{camp.title}</h4>
                                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{camp.description}</p>
                                  
                                  <div className="mt-auto space-y-3">
                                      <div className="flex justify-between text-xs font-medium">
                                          <span className="text-brand-600">{formatCurrency(camp.raised_amount)} raised</span>
                                          <span className="text-slate-500">Goal: {formatCurrency(camp.goal_amount)}</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progress}%` }}></div>
                                      </div>
                                      <button onClick={() => navigate('/campaign-marketplace')} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors">Fund Now</button>
                                  </div>
                              </div>
                          </div>
                      )
                  }) : (
                      <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">No recommendations currently available.</div>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Your Impact Portfolio</h3>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                                  <th className="px-6 py-3 font-semibold">Student / Campaign</th>
                                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-100">
                              {donations.length > 0 ? donations.map((d: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-slate-900">{d.campaign_title || 'Direct Donation'}</div>
                                          <div className="text-xs text-slate-500">To: {d.student_name}</div>
                                      </td>
                                      <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(d.amount)}</td>
                                      <td className="px-6 py-4 text-center">
                                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Completed</span>
                                      </td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No donations yet.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Transaction History</h3>
                      <button className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 border px-2 py-1 rounded">
                          <Download className="h-3 w-3" /> Report
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-96">
                      <ul className="divide-y divide-slate-100">
                          {transactions.length > 0 ? transactions.map((t: any, i: number) => (
                              <li key={i} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                                          <Heart className="h-5 w-5" />
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-900">Donation</p>
                                          <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</p>
                                      </div>
                                  </div>
                                  <div className="text-sm font-bold text-slate-900">-{formatCurrency(t.amount)}</div>
                              </li>
                          )) : (
                              <li className="p-8 text-center text-slate-500">No recent transactions.</li>
                          )}
                      </ul>
                  </div>
              </div>
          </div>
      </motion.div>
    </DashboardLayout>
  );
}
