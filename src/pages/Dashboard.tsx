import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import TopicManagement from '@/components/TopicManagement';
import { pushService } from '@/services/pushNotificationService';
import { LogOut, Copy, ExternalLink, Search, Filter, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchRecentNotifications, addNotification, supabase } from '@/services/notificationService';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    initializePushNotifications();
    loadRecentNotifications();
    
    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('New notification received:', payload.new);
          // Add new notification to the list
          setNotifications(prev => [payload.new, ...prev.slice(0, 4)]);
          // Increment unread count
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if enabled
          if ('Notification' in window && Notification.permission === 'granted') {
            showBrowserNotification(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mark notifications as read when viewing them
  const markAsRead = () => {
    setUnreadCount(0);
  };
  const showBrowserNotification = async (notification) => {
    try {
      // Play sound first
      await playNotificationSound(notification.priority || 'medium');
      
      // Show browser notification
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/mcm-logo-192.png',
        badge: '/mcm-logo-192.png',
        tag: 'mcm-realtime',
        requireInteraction: notification.priority === 'high',
        silent: false,
        vibrate: notification.priority === 'high' ? [300, 100, 300, 100, 300] : [200, 100, 200],
        data: {
          priority: notification.priority,
          timestamp: Date.now()
        }
      });

      // Auto-close after delay
      setTimeout(() => {
        try {
          browserNotification.close();
        } catch (e) {
          // Notification might already be closed
        }
      }, notification.priority === 'high' ? 10000 : 5000);

      // Show toast notification
      toast({
        title: `🔔 ${notification.title}`,
        description: notification.body,
        duration: 5000,
      });

    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  };

  const initializePushNotifications = async () => {
    await pushService.initialize();
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const loadRecentNotifications = async () => {
    try {
      // First try with acknowledged column, fallback without it
      const { data, error } = await supabase 
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      // Handle notifications with or without acknowledged column
      const notificationsWithAck = (data || []).map(n => ({
        ...n,
        acknowledged: n.acknowledged || false
      }));
      
      setNotifications(notificationsWithAck);
      setUnreadCount(notificationsWithAck.filter(n => !n.acknowledged).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  const sendTestNotification = async (priority: 'low' | 'medium' | 'high') => {
    try {
      // Always request permission first to show browser dialog
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Notifications Blocked",
          description: "Please click 'Allow' in the browser dialog to enable notifications",
          variant: "destructive",
        });
        return;
      }

      // Send simple browser notification
      const title = `MCM Alert - ${priority.toUpperCase()} Priority`;
      const body = `Test notification (${priority} priority) - ${new Date().toLocaleTimeString()}`;
      
      // Create browser notification
      const notification = new Notification(title, {
        body,
        icon: '/mcm-logo-192.png',
        badge: '/mcm-logo-192.png',
        tag: 'mcm-test',
        requireInteraction: priority === 'high',
        silent: false
      });

      // Play sound
      await playNotificationSound(priority);

      // Store in database
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test_notification',
          title,
          message: body,
          priority
        })
      });

      // Auto-close notification after delay
      setTimeout(() => {
        try {
          notification.close();
        } catch (e) {
          // Notification might already be closed
        }
      }, priority === 'high' ? 10000 : 5000);

      toast({
        title: "✅ Notification Sent!",
        description: `${priority.charAt(0).toUpperCase() + priority.slice(1)} priority notification sent successfully!`,
      });

      // Refresh notifications list
      loadRecentNotifications();
      
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: "Notification Failed",
        description: error.message || "Please allow notifications when prompted by your browser",
        variant: "destructive",
      });
    }
  };

  const playNotificationSound = async (priority: 'low' | 'medium' | 'high') => {
    try {
      const frequency = priority === 'high' ? 800 : priority === 'medium' ? 600 : 400;
      const duration = priority === 'high' ? 1.0 : 0.5;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (required for mobile)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      const volume = priority === 'high' ? 0.3 : priority === 'medium' ? 0.2 : 0.1;
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const acknowledgeNotification = async (notificationId: string) => {
    try {
      // Try to update via API first
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notificationId,
          acknowledged: true
        })
      });

      if (!response.ok) {
        // Fallback to direct Supabase update
        const { error } = await supabase
          .from('notifications')
          .update({ acknowledged: true })
          .eq('id', notificationId);

        if (error) throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, acknowledged: true }
            : n
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: "✅ Notification Acknowledged",
        description: "Notification has been marked as read",
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      toast({
        title: "❌ Error",
        description: "Failed to acknowledge notification",
        variant: "destructive",
      });
    }
  };

  const acknowledgeAllNotifications = async () => {
    try {
      // Try to update via API first
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acknowledgeAll: true
        })
      });

      if (!response.ok) {
        // Fallback to direct Supabase update
        const { error } = await supabase
          .from('notifications')
          .update({ acknowledged: true })
          .eq('acknowledged', false);

        if (error) throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, acknowledged: true }))
      );
      setUnreadCount(0);

      toast({
        title: "✅ All Notifications Acknowledged",
        description: "All notifications have been marked as read",
      });
    } catch (error) {
      console.error('Error acknowledging all notifications:', error);
      toast({
        title: "❌ Error",
        description: "Failed to acknowledge all notifications",
        variant: "destructive",
      });
    }
  };

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || notification.type === filterType;
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const copyApiUrl = () => {
    const apiUrl = `${window.location.origin}/api/notifications`;
    navigator.clipboard.writeText(apiUrl);
    toast({
      title: "Copied!",
      description: "API URL copied to clipboard"
    });
  };

  const examplePayload = `{
  "type": "site_down",
  "title": "Site Down Alert", 
  "message": "example.com is not responding",
  "site": "example.com",
  "priority": "high",
  "timestamp": "${new Date().toISOString()}"
}`;

  return (
    <div className="min-h-screen bg-background">
      <Header unreadCount={unreadCount} />
      <div className="container mx-auto px-4 py-6">
        {/* Header with Logout */}
        <div className="flex items-center justify-end mb-6">
          <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Topic Management */}
            <TopicManagement />

            {/* API Integration */}
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Send notifications via API:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono">POST {window.location.origin}/api/notifications</code>
                    <Button variant="ghost" size="sm" onClick={copyApiUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Link to="/api-docs">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>API Documentation</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center justify-between w-full">
                  <CardTitle>Recent Notifications</CardTitle>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        onClick={acknowledgeAllNotifications}
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark All Read
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { navigate('/notifications'); markAsRead(); }}
                      className="text-xs h-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    >
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Search and Filter Controls - Improved Layout */}
              <div className="px-6 pb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px] h-9 border-slate-200 focus:border-slate-400">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[140px] h-9 border-slate-200 focus:border-slate-400">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <CardContent onClick={markAsRead}>
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-6">
                    {searchTerm || filterType !== "all" || filterPriority !== "all" ? (
                      <>
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No notifications match your filters</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">No notifications yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Test notifications to see them here
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div 
                    className="space-y-2 max-h-96 overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}
                  >
                    {filteredNotifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          !n.acknowledged 
                            ? 'bg-slate-50 border-slate-200 shadow-sm ring-1 ring-slate-100 border-l-4 border-l-slate-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-sm">{n.title}</div>
                            {!n.acknowledged && (
                              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 font-medium">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={n.priority === 'high' ? 'destructive' : n.priority === 'medium' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {n.priority || 'medium'}
                            </Badge>
                            {!n.acknowledged && (
                              <Button
                                onClick={() => acknowledgeNotification(n.id)}
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border-slate-300"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-foreground/80 mb-2 leading-relaxed">{n.body}</div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                          {new Date(n.created_at).toLocaleString()}
                          {n.acknowledged && (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <Check className="h-3 w-3" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Notification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🔔 Test Notifications</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Button onClick={() => sendTestNotification('medium')} className="w-full mb-4 bg-slate-700 hover:bg-slate-800 text-white">
                  Test Notification
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => sendTestNotification('low')} className="text-xs border-slate-300 text-slate-600 hover:bg-slate-50">
                    Low
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => sendTestNotification('medium')} className="text-xs border-slate-300 text-slate-600 hover:bg-slate-50">
                    Medium
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => sendTestNotification('high')} className="text-xs">
                    High
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;