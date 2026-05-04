import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiCall, auth, formatCurrency } from '../lib/utils';
import { 
  DollarSign, User as UserIcon, Briefcase, CheckSquare, 
  ArrowDownLeft, ArrowUpRight, Heart, CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{show: boolean, x: number, y: number, value: string}>({ show: false, x: 0, y: 0, value: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const user = auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'admin') navigate('/admin-dashboard');
        if (user.role === 'donor') navigate('/donor-dashboard');

        const result = await apiCall(`api/dashboard/student.php`);
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

  const totalLoans = parseFloat(data?.total_debt || '0');
  const activeCampaigns = data?.campaigns?.filter((c: any) => c.status === 'active')?.length || 0;
  const fundedCampaigns = data?.campaigns?.filter((c: any) => parseFloat(c.raised_amount || '0') >= parseFloat(c.goal_amount))?.length || 0;
  const totalRaised = parseFloat(data?.total_raised || '0');
  const creditScore = data?.profile?.credit_score || 'N/A';
  const score = parseInt(creditScore === 'N/A' ? '300' : creditScore) || 300;
  const trustScore = Math.round(((score - 300) / 550) * 100);
  
  const riskTier = data?.profile?.risk_tier || 'High';
  let tierColor = 'bg-gray-100 text-gray-700';
  if (riskTier === 'Low') tierColor = 'bg-emerald-100 text-emerald-700';
  else if (riskTier === 'Medium') tierColor = 'bg-yellow-100 text-yellow-700';
  else if (riskTier === 'High') tierColor = 'bg-orange-100 text-orange-700';
  else if (riskTier === 'Very High') tierColor = 'bg-red-100 text-red-700';

  const formatHeaderCase = (str: string) => str ? str.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase()) : '';

  // Calculate SVG
  const history = data?.financial_history || [];
  const svgHeight = 250;
  const svgWidth = 800;
  let points: any[] = [];
  let pathD = '';
  let areaD = '';

  if (history.length > 0) {
    const values = history.map((h: any) => parseFloat(h.total));
    const maxValue = Math.max(...values, 5000) * 1.2;
    const xStep = history.length > 1 ? svgWidth / (history.length - 1) : 0;
    
    points = values.map((val: number, index: number) => ({
        x: index * xStep,
        y: svgHeight - ((val / maxValue) * svgHeight),
        val,
        month: history[index].day
    }));

    pathD = `M ${points[0].x},${points[0].y}`;
    if (points.length > 1) {
        for (let i = 1; i < points.length; i++) {
            const curr = points[i];
            const prev = points[i - 1];
            const cp1x = prev.x + (curr.x - prev.x) / 2;
            const cp2x = curr.x - (curr.x - prev.x) / 2;
            pathD += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`;
        }
    } else {
        pathD += ` L ${svgWidth},${points[0].y}`;
    }
    areaD = `${pathD} V ${svgHeight} H 0 Z`;
  }

  const handleTooltip = (e: React.MouseEvent, val: number) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = (e.currentTarget as HTMLElement).closest('.relative')!.getBoundingClientRect();
      setTooltip({
          show: true,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top,
          value: formatCurrency(val)
      });
  };

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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
          <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                  <DollarSign className="h-7 w-7" />
              </div>
              <div>
                  <div className="text-sm text-slate-500 font-medium">Total Outstanding Debt</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalLoans)}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">Current Balance</div>
              </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <UserIcon className="h-7 w-7" />
              </div>
              <div>
                  <div className="text-sm text-slate-500 font-medium">Active Campaigns</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{activeCampaigns}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">{fundedCampaigns} funded</div>
              </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
                  <Briefcase className="h-7 w-7" />
              </div>
              <div>
                  <div className="text-sm text-slate-500 font-medium">Funds Raised</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalRaised)}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">Across all campaigns</div>
              </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckSquare className="h-7 w-7" />
              </div>
              <div>
                  <div className="text-sm text-slate-500 font-medium">Credit Score</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{creditScore}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">Updated recently</div>
              </div>
          </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-bold text-lg text-slate-900">Financial Overview</h3>
              </div>

              <div className="h-64 w-full relative group">
                  <div style={{ opacity: tooltip.show ? 1 : 0, left: tooltip.x, top: tooltip.y }} className="absolute pointer-events-none transition-opacity duration-200 z-10 bg-slate-900 text-white text-xs rounded-lg py-1 px-2 shadow-xl -translate-x-1/2 -translate-y-full mt-[-8px]">
                      <span className="font-bold">{tooltip.value}</span>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>

                  {history.length > 0 ? (
                      <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
                          <defs>
                              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                              </linearGradient>
                          </defs>
                          <line x1="0" y1="250" x2="800" y2="250" stroke="#f1f5f9" strokeWidth="1" />
                          <line x1="0" y1="175" x2="800" y2="175" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="25" x2="800" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                          <path d={areaD} fill="url(#areaGradient)" className="animate-area-fade" />
                          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-line-draw" />

                          <g className="data-points">
                              {points.map((p, i) => (
                                  <circle key={i} cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#6366f1" strokeWidth="2"
                                      className="hover:r-8 transition-all cursor-pointer"
                                      onMouseOver={(e) => handleTooltip(e, p.val)} onMouseOut={() => setTooltip({...tooltip, show: false})} />
                              ))}
                          </g>
                      </svg>
                  ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">No financial history available.</div>
                  )}
                  {history.length > 0 && (
                      <div className="flex justify-between text-xs text-slate-400 font-medium mt-2 px-2">
                          {points.filter((_,i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length/6) === 0).map((p, i) => (
                              <span key={i}>{p.month}</span>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-slate-100 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/50 rounded-full blur-3xl -mr-12 -mt-12"></div>
              <div className="relative z-10">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trust & Risk Score</h3>
                  <div className="text-5xl font-display font-bold text-slate-900 mb-2">{trustScore}</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-6 ${tierColor}`}>
                      {riskTier} Risk
                  </div>
              </div>
              <div className="relative z-10">
                  <h4 className="font-bold text-slate-900 text-sm mb-3">Improve Score:</h4>
                  <ul className="text-slate-500 text-xs space-y-2">
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Pay installments on time</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Keep credit utilization low</li>
                  </ul>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-bold text-lg text-slate-900">Recent Activity</h3>
              </div>
              <div className="space-y-6">
                  {data?.recent_transactions?.slice(0, 5).map((txn: any, i: number) => {
                      let Icon = ArrowDownLeft;
                      let color = 'green';
                      let title = 'Transaction';
                      if (txn.type === 'loan_disbursal' || txn.type === 'loan_disbursement') { Icon = ArrowDownLeft; color = 'green'; title = 'Loan Disbursed'; }
                      else if (txn.type === 'loan_repayment') { Icon = ArrowUpRight; color = 'blue'; title = 'Repayment Sent'; }
                      else if (txn.type === 'donation') { Icon = Heart; color = 'pink'; title = 'Donation Received'; }
                      const isCredit = parseFloat(txn.amount) > 0;

                      return (
                          <div key={i} className="flex gap-4">
                              <div className={`h-10 w-10 text-${color}-600 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                                  <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <p className="font-bold text-slate-900 text-sm">{title}</p>
                                          <p className="text-xs text-slate-500">{txn.description || formatHeaderCase(txn.type)}</p>
                                      </div>
                                      <span className="font-bold text-slate-900 text-sm">{isCredit ? '+' : ''}{formatCurrency(txn.amount)}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1">{new Date(txn.created_at).toLocaleString()}</p>
                              </div>
                          </div>
                      );
                  })}
                  {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
                      <p className="text-slate-400 text-sm">No recent activity.</p>
                  )}
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <h3 className="font-display font-bold text-lg text-slate-900 mb-6">Upcoming</h3>
              <div className="space-y-4">
                  {data?.upcoming_obligations && data.upcoming_obligations.length > 0 ? (
                      data.upcoming_obligations.map((item: any, i: number) => {
                          const date = new Date(item.due_date);
                          const day = date.getDate();
                          const month = date.toLocaleString('default', { month: 'short' });
                          return (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all group">
                                  <div className="h-12 w-12 rounded-lg bg-slate-100 group-hover:bg-brand-100 flex flex-col items-center justify-center text-slate-500 group-hover:text-brand-600 transition-colors flex-shrink-0">
                                      <span className="text-xs font-bold uppercase leading-none">{month}</span>
                                      <span className="text-lg font-bold leading-none">{day}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="font-bold text-slate-900 text-sm truncate">{item.loan_title}</p>
                                      <p className="text-xs text-slate-500">Due: <span className="font-bold text-slate-700">{formatCurrency(item.installment_amount)}</span></p>
                                  </div>
                                  <button onClick={() => navigate('/my-loans')} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap">Pay</button>
                              </div>
                          )
                      })
                  ) : (
                      <div className="text-center py-8">
                          <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                              <CheckCircle className="h-6 w-6" />
                          </div>
                          <p className="text-sm text-slate-500 font-medium">No upcoming payments!</p>
                          <p className="text-xs text-slate-400">You're all caught up.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </DashboardLayout>
  );
}
