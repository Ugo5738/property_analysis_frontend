import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import axiosInstance from "..//utils/axiosConfig";

interface Prompt {
  name: string;
  content: string;
  version?: number;
  is_active?: boolean;
}

const PromptUpdater = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPrompt, setShowCurrentPrompt] = useState(true);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseType, setResponseType] = useState<'success' | 'error'>('success');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

  const promptName = 'labelling_prompt';

  useEffect(() => {
    const fetchCurrentPrompt = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/api/analysis/get-prompt/?name=${encodeURIComponent(promptName)}`);
        const data: Prompt = response.data
        setCurrentPrompt(data);
        // Pre-fill form with current content and spaces
        setContent(data.content);
      } catch (err) {
        setResponseType('error');
        setResponseMessage('Failed to fetch current prompt');
        setCurrentPrompt(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentPrompt();
  }, []);

  const updatePrompt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axiosInstance.post('/api/analysis/update-prompt/', {
        name: promptName,
        content: content
      });
      
      setResponseType('success');
      setResponseMessage(response.data.message || 'Prompt updated successfully!');
      
      // Optionally refresh the current prompt after successful update
      const updatedPrompt = await axiosInstance.get(`/api/analysis/get-prompt/?name=${encodeURIComponent(promptName)}`);
      setCurrentPrompt(updatedPrompt.data);
    } catch (error) {
      console.error('Error updating prompt:', error);
      setResponseType('error');
      setResponseMessage('Error updating prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Prompt Manager</h1>
        <button
          onClick={() => setShowCurrentPrompt(!showCurrentPrompt)}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {showCurrentPrompt ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Current
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Current
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showCurrentPrompt && (
          <div className="p-6 rounded-lg bg-gray-50 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Current Prompt (Version {currentPrompt?.version || '0'})</h2>
            <div className="bg-white p-4 rounded-md border border-gray-200 h-[500px] overflow-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {currentPrompt?.content || 'No current prompt found'}
              </pre>
            </div>
          </div>
        )}

        <div className={`p-6 rounded-lg bg-white border border-gray-200 ${!showCurrentPrompt ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">New Prompt</h2>
          <form onSubmit={updatePrompt} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the new prompt content..."
              className="w-full h-[500px] p-4 rounded-md border border-gray-200 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Prompt
                  </>
                )}
              </button>

              {responseMessage && (
                <Alert className={`w-auto ${responseType === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <AlertDescription className={`text-sm ${responseType === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {responseMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PromptUpdater;