import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Monitor, Globe, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/notificationService';

interface Topic {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  subscribed: boolean;
  apiEndpoint: string;
  lastChecked: Date;
  createdAt: Date;
}

const TopicManagement: React.FC = () => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [loadingTopics, setLoadingTopics] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [togglingTopicId, setTogglingTopicId] = useState<string | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [subscribingTopicId, setSubscribingTopicId] = useState<string | null>(null);

  const [confirmDeleteTopic, setConfirmDeleteTopic] = useState<Topic | null>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const generateApiEndpoint = (topicName: string) => {
    const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${window.location.origin}/api/topics/${slug}`;
  };

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });


      if (data && data.length > 0) {
        const formattedTopics = data.map(topic => ({
          id: topic.id,
          name: topic.name,
          description: topic.description,
          enabled: topic.enabled || false,
          subscribed: topic.subscribed || false,
          apiEndpoint: topic.api_endpoint || generateApiEndpoint(topic.name),
          lastChecked: topic.last_checked ? new Date(topic.last_checked) : new Date(),
          createdAt: topic.created_at ? new Date(topic.created_at) : new Date(),
        }));
        setTopics(formattedTopics);
      } else {
        // Create default topic in Supabase if none exist
        const apiEndpoint = generateApiEndpoint('Site Monitoring');
        const { data: newTopic, error: createError } = await supabase
          .from('topics')
          .insert([{
            name: 'Site Monitoring',
            description: 'Monitor website uptime and downtime with instant alerts when your sites become unreachable or recover',
            enabled: true,
            api_endpoint: apiEndpoint,
            last_checked: new Date().toISOString(),
          }])
          .select()
          .single();

        if (!createError && newTopic) {
          const defaultTopic: Topic = {
            id: newTopic.id,
            name: newTopic.name,
            description: newTopic.description,
            enabled: newTopic.enabled,
            subscribed: false,
            apiEndpoint: newTopic.api_endpoint,
            lastChecked: new Date(newTopic.last_checked),
            createdAt: new Date(newTopic.created_at),
          };
          setTopics([defaultTopic]);
        }
      }

      if (error) {
        console.error('Failed to load topics:', error);
        toast({
          title: "Error",
          description: "Failed to load topics from database",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopic.name.trim()) {
      toast({
        title: "Error",
        description: "Topic name is required",
        variant: "destructive",
      });
      return;
    }

    setCreatingTopic(true);
    try {
      const apiEndpoint = generateApiEndpoint(newTopic.name);
      
      const { data, error } = await supabase
        .from('topics')
        .insert([{
          name: newTopic.name.trim(),
          description: newTopic.description.trim(),
          enabled: true,
          subscribed: false,
          api_endpoint: apiEndpoint,
          last_checked: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      const topic: Topic = {
        id: data.id,
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        subscribed: data.subscribed || false,
        apiEndpoint: data.api_endpoint,
        lastChecked: new Date(data.last_checked),
        createdAt: new Date(data.created_at),
      };

      setTopics(prev => [topic, ...prev]);

      toast({
        title: "Topic Created",
        description: `"${topic.name}" has been created successfully`,
      });

      setIsDialogOpen(false);
      setNewTopic({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create topic:', error);
      toast({
        title: "Error",
        description: "Failed to create topic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingTopic(false);
    }
  };

  const toggleTopic = async (id: string) => {
    if (togglingTopicId) return;

    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    setTopics(prev =>
      prev.map(t =>
        t.id === id ? { ...t, enabled: !t.enabled, lastChecked: new Date() } : t
      )
    );
    setTogglingTopicId(id);

    try {
      const { error } = await supabase
        .from('topics')
        .update({
          enabled: !topic.enabled,
          last_checked: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to toggle topic:', error);
      toast({
        title: "Error",
        description: "Failed to update topic. Please try again.",
        variant: "destructive",
      });
      setTopics(prev =>
        prev.map(t =>
          t.id === id ? { ...t, enabled: topic.enabled, lastChecked: topic.lastChecked } : t
        )
      );
    } finally {
      setTogglingTopicId(null);
    }
  };

  const toggleSubscription = async (id: string) => {
    if (subscribingTopicId) return;

    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    setTopics(prev =>
      prev.map(t =>
        t.id === id ? { ...t, subscribed: !t.subscribed } : t
      )
    );
    setSubscribingTopicId(id);

    try {
      const { error } = await supabase
        .from('topics')
        .update({
          subscribed: !topic.subscribed,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: topic.subscribed ? "Unsubscribed" : "Subscribed",
        description: `You have ${topic.subscribed ? 'unsubscribed from' : 'subscribed to'} "${topic.name}"`,
      });
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
      setTopics(prev =>
        prev.map(t =>
          t.id === id ? { ...t, subscribed: topic.subscribed } : t
        )
      );
    } finally {
      setSubscribingTopicId(null);
    }
  };

  const copyApiEndpoint = (endpoint: string, topicName: string) => {
    navigator.clipboard.writeText(endpoint);
    toast({
      title: "Copied!",
      description: `API endpoint for "${topicName}" copied to clipboard`,
    });
  };

  const confirmDelete = (topic: Topic) => setConfirmDeleteTopic(topic);

  const handleDeleteTopic = async () => {
    if (!confirmDeleteTopic) return;

    setDeletingTopicId(confirmDeleteTopic.id);

    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', confirmDeleteTopic.id);

      if (error) throw error;

      setTopics(prev => prev.filter(t => t.id !== confirmDeleteTopic.id));

      toast({
        title: "Topic Deleted",
        description: `"${confirmDeleteTopic.name}" has been deleted`,
      });
      setConfirmDeleteTopic(null);
    } catch (error) {
      console.error('Failed to delete topic:', error);
      toast({
        title: "Error",
        description: "Failed to delete topic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingTopicId(null);
    }
  };

  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const subscribedCount = topics.filter(t => t.subscribed).length;
  const enabledCount = topics.filter(t => t.enabled).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Notification Subscriptions</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              {subscribedCount} Subscribed
            </Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">
              {enabledCount} Active
            </Badge>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center space-x-2" disabled={creatingTopic || loadingTopics}>
              <Plus className="h-4 w-4" />
              <span>Add Topic</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Topic</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="topic-name">Topic Name</Label>
                <Input
                  id="topic-name"
                  placeholder="Enter topic name"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                  disabled={creatingTopic}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-description">Description</Label>
                <Textarea
                  id="topic-description"
                  placeholder="Enter topic description"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  rows={3}
                  disabled={creatingTopic}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={creatingTopic}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTopic} disabled={creatingTopic}>
                  {creatingTopic ? 'Adding...' : 'Add Topic'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingTopics ? (
          <p className="text-center text-muted-foreground">Loading topics...</p>
        ) : (
          topics.map((topic) => (
            <div
              key={topic.id}
              className="flex flex-col space-y-3 p-4 border border-border rounded-lg transition-opacity duration-300 ease-in-out"
              style={{ opacity: deletingTopicId === topic.id ? 0.5 : 1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {topic.name === 'Site Monitoring' ? (
                      <Globe className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Monitor className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{topic.name}</p>
                      {topic.subscribed && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Subscribed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{topic.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Last checked: {formatLastChecked(topic.lastChecked)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        checked={topic.enabled}
                        onCheckedChange={() => toggleTopic(topic.id)}
                        disabled={togglingTopicId === topic.id}
                      />
                    </div>
                    <Button
                      variant={topic.subscribed ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleSubscription(topic.id)}
                      disabled={subscribingTopicId === topic.id}
                      className="text-xs h-7"
                    >
                      {subscribingTopicId === topic.id 
                        ? 'Processing...' 
                        : topic.subscribed 
                          ? 'Unsubscribe' 
                          : 'Subscribe'
                      }
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => confirmDelete(topic)}
                    disabled={deletingTopicId === topic.id}
                    aria-label={`Delete topic ${topic.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* API Endpoint Section */}
              <div className="bg-gray-50 p-3 rounded-md border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 mb-1">API Endpoint:</p>
                    <code className="text-xs font-mono text-gray-600 break-all">
                      {topic.apiEndpoint}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyApiEndpoint(topic.apiEndpoint, topic.name)}
                    className="ml-2 h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteTopic} onOpenChange={() => setConfirmDeleteTopic(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the topic <strong>{confirmDeleteTopic?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setConfirmDeleteTopic(null)} disabled={deletingTopicId === confirmDeleteTopic?.id}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTopic}
              disabled={deletingTopicId === confirmDeleteTopic?.id}
            >
              {deletingTopicId === confirmDeleteTopic?.id ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TopicManagement;