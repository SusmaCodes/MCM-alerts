const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rswwlwybqsinzckzwcpb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzd3dsd3licXNpbnpja3p3Y3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzY0MjcsImV4cCI6MjA2ODcxMjQyN30.OFDBSFnSWbage9xI5plqis7RAFKnJPuzO1JWUHE7yDM';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Enhanced CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Extract topic slug from path
  const pathParts = event.path.split('/');
  const topicSlug = pathParts[pathParts.length - 1];

  console.log('Topic endpoint called:', event.httpMethod, 'Topic:', topicSlug);
  console.log('Request body:', event.body);

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { title, message, priority = 'medium', ...otherData } = body;

      console.log('Parsed body:', { title, message, priority, otherData });

      if (!title || !message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required fields: title and message are required',
            received: { title, message }
          }),
        };
      }

      // Find the topic by slug
      const { data: topics, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .ilike('name', `%${topicSlug.replace(/-/g, ' ')}%`)
        .limit(1);

      if (topicError) {
        console.error('Topic lookup error:', topicError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to lookup topic',
            details: topicError.message 
          }),
        };
      }

      const topic = topics && topics.length > 0 ? topics[0] : null;
      const topicType = topic ? topic.name.toLowerCase().replace(/\s+/g, '_') : topicSlug.replace(/-/g, '_');

      // Store notification in Supabase
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            title,
            body: message,
            type: topicType,
            priority,
            metadata: {
              ...otherData,
              topic_slug: topicSlug,
              topic_name: topic?.name || topicSlug,
              api_endpoint: event.path
            },
            created_at: new Date().toISOString(),
            acknowledged: false
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to store notification',
            details: error.message 
          }),
        };
      }

      console.log('Topic notification stored successfully:', data[0]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: `Notification received for topic: ${topic?.name || topicSlug}`,
          notification: data[0],
          topic: topic?.name || topicSlug
        }),
      };
    } catch (error) {
      console.error('Error processing topic notification:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Internal server error',
          details: error.message 
        }),
      };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      // Get notifications for this specific topic
      const topicType = topicSlug.replace(/-/g, '_');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', topicType)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Supabase error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to fetch topic notifications',
            details: error.message 
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          topic: topicSlug,
          notifications: data || []
        }),
      };
    } catch (error) {
      console.error('Error fetching topic notifications:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Internal server error',
          details: error.message 
        }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};