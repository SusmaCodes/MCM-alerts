import React, { useEffect, useState } from 'react';
import { fetchAllNotifications } from '@/services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AllNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    fetchAllNotifications().then(setNotifications);
  }, []);

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || notification.type === filterType;
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });
  return (
    <div className="min-h-screen bg-background">
      <Header showSignIn={false} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">All Notifications</CardTitle>
            <p className="text-muted-foreground">Complete history of all notifications</p>
          </CardHeader>
          
          {/* Search and Filter Controls */}
          <div className="px-6 pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px] h-10 border-slate-200 focus:border-slate-400">
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
                  <SelectItem value="api_notification">API</SelectItem>
                  <SelectItem value="test_notification">Test Notification</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[160px] h-10 border-slate-200 focus:border-slate-400">
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
          
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm || filterType !== "all" || filterPriority !== "all" ? (
                  <>
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg text-muted-foreground mb-2">No notifications match your filters</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-muted-foreground mb-2">No notifications found</p>
                    <p className="text-sm text-muted-foreground">Notifications will appear here once they are created</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </div>
                {filteredNotifications.map((n) => (
                  <div key={n.id} className="p-6 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg text-foreground">{n.title}</div>
                        <Badge 
                          variant={n.priority === 'high' ? 'destructive' : n.priority === 'medium' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {n.priority || 'medium'}
                        </Badge>
                        {n.type && (
                          <Badge variant="outline" className="text-xs bg-white">
                            {n.type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-foreground/80 mb-4 leading-relaxed">{n.body}</div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                        {n.acknowledged && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            ✓ Acknowledged
                          </span>
                        )}
                      </div>
                      {n.metadata && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Has metadata
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllNotifications;
