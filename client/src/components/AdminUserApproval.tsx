import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { apiClient } from '../lib/axios';
import { CheckCircle, XCircle, Clock, Users, AlertCircle, Loader2, Eye } from 'lucide-react';

interface User {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  downloadCount: number;
}

interface UserStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export const AdminUserApproval: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/admin/users?status=${filter}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/admin/user-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filter]);

  const handleApprove = async (userId: string) => {
    try {
      setIsActionLoading(true);
      await apiClient.post(`/api/admin/approve-user/${userId}`);
      setMessage({ type: 'success', text: 'User approved successfully' });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve user';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' });
      return;
    }

    try {
      setIsActionLoading(true);
      await apiClient.post(`/api/admin/reject-user/${selectedUser._id}`, {
        reason: rejectionReason.trim()
      });
      setMessage({ type: 'success', text: 'User rejected successfully' });
      setSelectedUser(null);
      setRejectionReason('');
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject user';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-600 mt-1">Manage user accounts and approval status</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === 'all' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === 'pending' 
                ? 'bg-white text-amber-700 shadow-sm' 
                : 'text-slate-600 hover:text-amber-700 hover:bg-white/50'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === 'approved' 
                ? 'bg-white text-green-700 shadow-sm' 
                : 'text-slate-600 hover:text-green-700 hover:bg-white/50'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approved
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === 'rejected' 
                ? 'bg-white text-red-700 shadow-sm' 
                : 'text-slate-600 hover:text-red-700 hover:bg-white/50'
            }`}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Rejected
          </Button>
        </div>
      </div>



      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined: {formatDate(user.createdAt)} • Downloads: {user.downloadCount}
                        </p>
                      </div>
                      {getStatusBadge(user.status)}
                    </div>
                    {user.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                        <strong>Rejection Reason:</strong> {user.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {user.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(user._id)}
                          disabled={isActionLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedUser(user)}
                              disabled={isActionLoading}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject User</DialogTitle>
                              <DialogDescription>
                                Please provide a reason for rejecting {user.firstName} {user.lastName}'s account.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Label htmlFor="rejection-reason">Rejection Reason</Label>
                              <Textarea
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter the reason for rejection..."
                                rows={3}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(null);
                                  setRejectionReason('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={isActionLoading || !rejectionReason.trim()}
                              >
                                {isActionLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    Rejecting...
                                  </>
                                ) : (
                                  'Reject User'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
