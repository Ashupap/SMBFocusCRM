import OpenAI from 'openai';
import type { Contact, Deal, Activity } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface LeadScoreResult {
  score: number;
  factors: {
    engagement: number;
    dealValue: number;
    recency: number;
    completeness: number;
    reasoning: string;
  };
}

export interface ForecastResult {
  predictedRevenue: number;
  confidence: number;
  factors: {
    historicalTrend: string;
    pipelineHealth: string;
    seasonality: string;
    reasoning: string;
  };
}

export interface RecommendationResult {
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'task';
  title: string;
  description: string;
  reasoning: string;
  priority: number;
}

export async function calculateLeadScore(
  contact: Contact,
  deals: Deal[],
  activities: Activity[]
): Promise<LeadScoreResult> {
  const prompt = `You are a CRM AI analyzing a lead's quality. Score this lead from 0-100 based on:

Contact Info:
- Name: ${contact.firstName} ${contact.lastName}
- Email: ${contact.email}
- Phone: ${contact.phone || 'Not provided'}
- Title: ${contact.title || 'Not provided'}

Deal History:
- Total Deals: ${deals.length}
- Active Deals: ${deals.filter(d => !['won', 'lost'].includes(d.stage)).length}
- Won Deals: ${deals.filter(d => d.stage === 'won').length}
- Total Value: $${deals.reduce((sum, d) => sum + Number(d.value || 0), 0)}

Recent Activity:
- Total Activities: ${activities.length}
- Last 30 days: ${activities.filter(a => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(a.createdAt || '') > thirtyDaysAgo;
}).length}

Provide a JSON response with:
{
  "score": <0-100>,
  "engagement": <0-10>,
  "dealValue": <0-10>,
  "recency": <0-10>,
  "completeness": <0-10>,
  "reasoning": "Brief explanation"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      score: result.score || 50,
      factors: {
        engagement: result.engagement || 5,
        dealValue: result.dealValue || 5,
        recency: result.recency || 5,
        completeness: result.completeness || 5,
        reasoning: result.reasoning || 'Unable to analyze',
      },
    };
  } catch (error) {
    console.error('Error calculating lead score:', error);
    return {
      score: 50,
      factors: {
        engagement: 5,
        dealValue: 5,
        recency: 5,
        completeness: 5,
        reasoning: 'Error analyzing lead',
      },
    };
  }
}

export async function generateSalesForecast(
  deals: Deal[],
  historicalData: { period: string; revenue: number }[]
): Promise<ForecastResult> {
  const pipelineValue = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + Number(d.value || 0) * (Number(d.probability || 0) / 100), 0);

  const prompt = `You are a sales forecasting AI. Predict next month's revenue based on:

Current Pipeline:
- Total Pipeline Value: $${pipelineValue}
- Active Deals: ${deals.filter(d => !['won', 'lost'].includes(d.stage)).length}
- Avg Deal Size: $${pipelineValue / Math.max(deals.length, 1)}

Historical Revenue (last 6 months):
${historicalData.slice(-6).map(d => `- ${d.period}: $${d.revenue}`).join('\n')}

Provide a JSON response with:
{
  "predictedRevenue": <number>,
  "confidence": <0-100>,
  "historicalTrend": "Brief trend analysis",
  "pipelineHealth": "Pipeline assessment",
  "seasonality": "Seasonal factors",
  "reasoning": "Forecast explanation"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      predictedRevenue: result.predictedRevenue || pipelineValue * 0.3,
      confidence: result.confidence || 50,
      factors: {
        historicalTrend: result.historicalTrend || 'Insufficient data',
        pipelineHealth: result.pipelineHealth || 'Normal',
        seasonality: result.seasonality || 'No significant patterns',
        reasoning: result.reasoning || 'Forecast based on pipeline value',
      },
    };
  } catch (error) {
    console.error('Error generating forecast:', error);
    return {
      predictedRevenue: pipelineValue * 0.3,
      confidence: 50,
      factors: {
        historicalTrend: 'Error analyzing',
        pipelineHealth: 'Unknown',
        seasonality: 'Unknown',
        reasoning: 'Error generating forecast',
      },
    };
  }
}

export async function generateRecommendations(
  contact: Contact,
  deals: Deal[],
  activities: Activity[]
): Promise<RecommendationResult[]> {
  const lastActivity = activities.sort((a, b) => 
    new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  )[0];

  const daysSinceLastContact = lastActivity 
    ? Math.floor((Date.now() - new Date(lastActivity.createdAt || '').getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const openDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));

  const prompt = `You are a CRM AI recommending next best actions for a sales rep.

Contact: ${contact.firstName} ${contact.lastName}
- Email: ${contact.email}
- Title: ${contact.title || 'Not provided'}
- Days since last contact: ${daysSinceLastContact}

Open Deals: ${openDeals.length}
${openDeals.map(d => `- ${d.title}: $${d.value} (${d.stage})`).join('\n')}

Recent Activities:
${activities.slice(0, 5).map(a => `- ${a.type}: ${a.description || 'No description'}`).join('\n')}

Suggest 2-3 high-value next actions. Provide a JSON array of:
[{
  "type": "call|email|meeting|follow_up|task",
  "title": "Clear action title",
  "description": "Specific action details",
  "reasoning": "Why this action",
  "priority": 1-5 (1=highest)
}]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    const recommendations = response.recommendations || [];
    
    return recommendations.slice(0, 3).map((rec: any) => ({
      type: rec.type || 'follow_up',
      title: rec.title || 'Follow up with contact',
      description: rec.description || 'Schedule a follow-up',
      reasoning: rec.reasoning || 'Maintain engagement',
      priority: rec.priority || 3,
    }));
  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    if (daysSinceLastContact > 7) {
      return [{
        type: 'follow_up',
        title: 'Follow up with contact',
        description: `It's been ${daysSinceLastContact} days since last contact. Schedule a check-in call.`,
        reasoning: 'Maintain engagement momentum',
        priority: 2,
      }];
    }
    
    return [];
  }
}
