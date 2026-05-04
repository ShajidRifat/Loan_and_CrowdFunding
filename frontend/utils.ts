export interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  status: string;
  token?: string;
  wallet: number;
  avatar: string;
  restricted?: boolean;
}

export const formatCurrency = (amount: number | string): string => {
  const val = Number(amount) || 0;
  return '৳' + val.toLocaleString('en-BD');
};

export const apiCall = async (endpoint: string, method: string = 'GET', body: any = null): Promise<any> => {
  console.log(`[API] Calling ${endpoint} (${method})`);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const userStr = localStorage.getItem('unifund_user');
  if (userStr) {
      try {
          const user = JSON.parse(userStr);
          if (user.token) headers['Authorization'] = `Bearer ${user.token}`;
      } catch (e) { console.error('Token Parse Error', e); }
  }

  const config: RequestInit = { method, headers };
  if (body) config.body = JSON.stringify(body);

  let data: any;
  try {
      let response = await fetch(`/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`, config);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json();
      } else {
          const text = await response.text();
          if (text.includes('<?php') || text.includes('db_config.php')) {
              throw new Error('SERVER ERROR: PHP is not executing.');
          }
          try { data = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON response'); }
      }

      if (!response.ok) throw new Error(data.message || 'API request failed');
      
      // Auto-unwrap newer standard API responses
      if (data && typeof data.success === 'boolean') {
          if (!data.success) throw new Error(data.message || 'API request failed');
          return data.data;
      }

      return data;
  } catch (error: any) {
      console.log(`[API] Fetch failed for ${endpoint}:`, error);
      if (!error.message) error.message = 'Network or Server Error';
      throw error;
  }
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'funded': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
  }
};

export const getRiskColor = (tier: string) => {
  switch (tier) {
      case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
  }
};

export const calculateRiskScore = (student: any) => {
  const cgpaScore = (student.cgpa / 4.0) * 30;
  const creditScorePoints = (student.creditScore / 100) * 40;
  const historyScore = (student.repaymentHistory / 100) * 30;
  const totalScore = Math.round(cgpaScore + creditScorePoints + historyScore);

  let tier = 'High';
  if (totalScore >= 75) tier = 'Low';
  else if (totalScore >= 50) tier = 'Medium';

  return { score: totalScore, tier };
};

const AUTH_KEY = 'unifund_user';

export const auth = {
    getUser: (): User | null => {
        const userStr = localStorage.getItem(AUTH_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    },
    setCurrentUser: (user: User) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    },
    login: async (email: string, password: string) => {
        try {
            const data = await apiCall('api/login.php', 'POST', { email, password });
            if (!data.user) throw new Error('Invalid server response: User data missing');

            const user: User = {
                id: data.user.id,
                name: data.user.full_name,
                role: data.user.role,
                email: data.user.email,
                status: data.user.status,
                token: data.token,
                wallet: parseFloat(data.user.wallet_balance || 0),
                avatar: data.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.full_name.replace(' ', '')}`,
                restricted: data.user.restricted
            };
            auth.setCurrentUser(user);
            return { success: true, role: user.role };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },
    signup: async (name: string, email: string, password: string, role: string) => {
        try {
            const data = await apiCall('api/register.php', 'POST', { full_name: name, email, password, role });
            const newUser: User = {
                id: data.user_id,
                name,
                email,
                role,
                status: 'active',
                token: data.token,
                wallet: 0,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
            };
            auth.setCurrentUser(newUser);
            return { success: true, role };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },
    logout: () => {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = '/login';
    },
    refreshUser: async () => {
        const user = auth.getUser();
        if (!user) return null;
        try {
            const data = await apiCall(`api/get_profile.php?user_id=${user.id}`);
            if (data && data.user) {
                const updatedUser = {
                    ...user,
                    name: data.user.full_name,
                    email: data.user.email,
                    wallet: parseFloat(data.wallet_balance || 0),
                    avatar: data.user.avatar_url
                };
                auth.setCurrentUser(updatedUser);
                return updatedUser;
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
        }
        return user;
    }
};
