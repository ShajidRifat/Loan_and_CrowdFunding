import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiCall, auth } from '../lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const u = auth.getUser();
        if (!u) { navigate('/login'); return; }
        setUser(u);

        const fetchProfile = async () => {
            try {
                const data = await apiCall(`api/get_profile.php?user_id=${u.id}`);
                if (data && data.user) {
                    setProfile({ ...data.user, ...data.profile });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handlePasswordChange = async () => {
        if (!passwords.new) return alert('Please enter a new password');
        if (passwords.new !== passwords.confirm) return alert('Passwords do not match');

        setUpdating(true);
        try {
            await apiCall('api/update_profile.php', 'POST', {
                user_id: user?.id,
                new_password: passwords.new
            });
            alert('Password updated successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            alert(err.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div></DashboardLayout>;

    const nameParts = (profile?.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
        <DashboardLayout>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 pt-4">
                <div className="max-w-4xl mx-auto fade-in">
                    <div className="mb-8 flex items-center gap-4">
                        <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                            <ArrowLeft className="h-6 w-6 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-slate-900">Profile Settings</h1>
                            <p className="text-slate-500 mt-1">Manage your account information</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-brand-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                            </div>

                            <div className="flex flex-col items-center mb-8">
                                <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-200">
                                    <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(profile?.full_name || 'User').replace(' ', '')}`} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">First Name</label>
                                    <input type="text" readOnly value={firstName} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium outline-none" placeholder="First Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                                    <input type="text" readOnly value={lastName} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium outline-none" placeholder="Last Name" />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-bold text-slate-700">Email Address</label>
                                <input type="email" readOnly value={profile?.email || ''} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium outline-none" placeholder="Email Address" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Phone Number</label>
                                <input type="tel" readOnly value={profile?.phone_number || ''} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium outline-none" placeholder="Phone Number" />
                            </div>
                        </div>

                        {user?.role === 'student' && (
                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1 h-6 bg-brand-600 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-slate-900">University Information</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">University</label>
                                        <input type="text" readOnly value={profile?.university || ''} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium outline-none" placeholder="University Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Student ID</label>
                                        <input type="text" readOnly value={profile?.student_id_number || ''} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium outline-none" placeholder="Student ID" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Major</label>
                                        <input type="text" readOnly value={profile?.major || ''} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium outline-none" placeholder="Major" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-brand-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Current Password</label>
                                    <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium text-slate-900" placeholder="Enter current password" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">New Password</label>
                                    <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium text-slate-900" placeholder="Enter new password" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                                    <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium text-slate-900" placeholder="Confirm new password" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                            <button onClick={() => window.history.back()} className="px-8 py-3 rounded-xl font-bold text-brand-600 border-2 border-brand-600 hover:bg-brand-50 transition-colors">
                                Cancel
                            </button>
                            <button disabled={updating} onClick={handlePasswordChange} className="px-8 py-3 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-1">
                                {updating ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
