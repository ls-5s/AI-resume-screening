import { useState, useEffect } from 'react';
import { Loader2, FileText, Sparkles, ChevronRight, CheckCircle, XCircle, Clock, Send, Briefcase, User, MessageSquare, Star, Settings } from 'lucide-react';
import { getResumes } from '../../api/resume';
import { batchScreenResumesWithAi, screenResumeWithAi, getAiConfigs, updateAiConfig } from '../../api/ai';
import type { Resume } from '../../types/resume';
import type { AiConfig } from '../../types/ai';

// AI 筛选结果类型
interface ScreeningResult {
  resumeId: number;
  recommendation: 'pass' | 'reject' | 'pending';
  score: number;
  reasoning: string;
  resume?: Resume;
}

// 推荐结果颜色
const recommendationColors = {
  pass: 'bg-green-500',
  reject: 'bg-red-500',
  pending: 'bg-yellow-500',
};

// 推荐结果标签
const recommendationLabels = {
  pass: '推荐通过',
  reject: '建议淘汰',
  pending: '待定',
};

export default function Jobs() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [screeningResults, setScreeningResults] = useState<Map<number, ScreeningResult>>(new Map());
  const [screeningResumeId, setScreeningResumeId] = useState<number | null>(null);
  const [jobRequirements, setJobRequirements] = useState('');
  const [screeningAll, setScreeningAll] = useState(false);
  const [aiConfigs, setAiConfigs] = useState<AiConfig[]>([]);
  const [selectedAiConfigId, setSelectedAiConfigId] = useState<number | null>(null);
  const [loadingAiConfigs, setLoadingAiConfigs] = useState(true);

  // 加载简历列表和AI配置
  useEffect(() => {
    loadResumes();
    loadAiConfigs();
  }, []);

  const loadAiConfigs = async () => {
    try {
      setLoadingAiConfigs(true);
      const configs = await getAiConfigs();
      setAiConfigs(configs);
      // 默认选择第一个或默认配置
      if (configs.length > 0) {
        const defaultConfig = configs.find(c => c.isDefault) || configs[0];
        setSelectedAiConfigId(defaultConfig.id);
        // 如果默认配置有 prompt，则自动填充岗位要求
        if (defaultConfig.prompt) {
          setJobRequirements(defaultConfig.prompt);
        }
      }
    } catch (error) {
      console.error('加载AI配置失败:', error);
    } finally {
      setLoadingAiConfigs(false);
    }
  };

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await getResumes();
      setResumes(data);
    } catch (error) {
      console.error('加载简历失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 选择简历
  const handleSelectResume = (resumeId: number) => {
    setSelectedResumeId(resumeId);
  };

  // 筛选单个简历
  const handleScreenResume = async (resumeId: number) => {
    if (!jobRequirements.trim()) {
      alert('请输入岗位要求');
      return;
    }

    if (!selectedAiConfigId) {
      alert('请选择AI配置');
      return;
    }

    try {
      setScreeningResumeId(resumeId);
      const result = await screenResumeWithAi({
        resumeId,
        jobRequirements,
        aiConfigId: selectedAiConfigId,
      });
      
      const resume = resumes.find(r => r.id === resumeId);
      setScreeningResults(prev => {
        const newMap = new Map(prev);
        newMap.set(resumeId, { ...result, resumeId, resume });
        return newMap;
      });

      // 保存岗位要求到 AI 配置
      try {
        await updateAiConfig(selectedAiConfigId!, { prompt: jobRequirements });
        // 更新本地配置列表中的 prompt
        setAiConfigs(prev => prev.map(config => 
          config.id === selectedAiConfigId ? { ...config, prompt: jobRequirements } : config
        ));
      } catch (saveError) {
        console.error('保存岗位要求到AI配置失败:', saveError);
      }
    } catch (error) {
      console.error('AI筛选失败:', error);
      alert('AI筛选失败，请重试');
    } finally {
      setScreeningResumeId(null);
    }
  };

  // 批量筛选
  const handleBatchScreen = async () => {
    if (!jobRequirements.trim()) {
      alert('请输入岗位要求');
      return;
    }

    if (!selectedAiConfigId) {
      alert('请选择AI配置');
      return;
    }

    if (resumes.length === 0) {
      alert('暂无简历可筛选');
      return;
    }

    try {
      setScreeningAll(true);
      const results = await batchScreenResumesWithAi({
        resumeIds: resumes.map(r => r.id),
        jobRequirements,
        aiConfigId: selectedAiConfigId,
      });

      setScreeningResults(prev => {
        const newMap = new Map(prev);
        results.forEach(item => {
          if (item.success && item.result) {
            const resume = resumes.find(r => r.id === item.resumeId);
            newMap.set(item.resumeId, { ...item.result, resumeId: item.resumeId, resume });
          }
        });
        return newMap;
      });

      // 保存岗位要求到 AI 配置
      try {
        await updateAiConfig(selectedAiConfigId!, { prompt: jobRequirements });
        // 更新本地配置列表中的 prompt
        setAiConfigs(prev => prev.map(config => 
          config.id === selectedAiConfigId ? { ...config, prompt: jobRequirements } : config
        ));
      } catch (saveError) {
        console.error('保存岗位要求到AI配置失败:', saveError);
      }
    } catch (error) {
      console.error('批量筛选失败:', error);
      alert('批量筛选失败，请重试');
    } finally {
      setScreeningAll(false);
    }
  };

  const selectedResume = resumes.find(r => r.id === selectedResumeId);
  const selectedResult = selectedResumeId ? screeningResults.get(selectedResumeId) : null;

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题区域 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">AI 简历筛选</h1>
        <p className="mt-1 text-gray-500">使用 AI 智能筛选匹配岗位要求的简历</p>
      </div>

      {/* 岗位要求输入区域 */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="inline-block w-4 h-4 mr-1" />
                  岗位要求
                </label>
                <textarea
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  placeholder="请输入岗位要求，例如：需要3年以上前端开发经验，熟悉React、Vue框架..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Settings className="inline-block w-4 h-4 mr-1" />
                  AI 配置
                </label>
                {loadingAiConfigs ? (
                  <div className="flex items-center justify-center h-10 bg-gray-50 rounded-lg">
                    <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
                  </div>
                ) : aiConfigs.length === 0 ? (
                  <div className="h-10 flex items-center justify-center bg-gray-50 rounded-lg text-sm text-gray-500">
                    暂无AI配置
                  </div>
                ) : (
                  <select
                    title="选择AI配置"
                    value={selectedAiConfigId ?? ''}
                    onChange={(e) => {
                      const configId = Number(e.target.value);
                      setSelectedAiConfigId(configId);
                      // 自动填充岗位要求
                      const selectedConfig = aiConfigs.find(c => c.id === configId);
                      if (selectedConfig?.prompt) {
                        setJobRequirements(selectedConfig.prompt);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    {aiConfigs.filter(config => config.id !== null).map((config) => (
                      <option key={config.id} value={config.id!}>
                        {config.name} ({config.model})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-7">
            <button
              onClick={handleBatchScreen}
              disabled={screeningAll || resumes.length === 0 || !selectedAiConfigId || !jobRequirements.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {screeningAll ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              批量筛选全部
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 - 左右分栏 */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* 左侧：简历列表 */}
        <div className="w-1/2 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              简历列表
              <span className="text-sm font-normal text-gray-500">({resumes.length})</span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-slate-400" size={36} />
              </div>
            ) : resumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <FileText className="text-slate-400" size={28} />
                </div>
                <p className="text-slate-500 font-medium">暂无简历数据</p>
                <p className="text-slate-400 text-sm mt-1">请先上传简历</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    onClick={() => handleSelectResume(resume.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      selectedResumeId === resume.id ? 'bg-purple-50 border-l-4 border-purple-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedResumeId === resume.id 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          <User className="text-white" size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{resume.name}</p>
                          <p className="text-sm text-gray-500 truncate">{resume.email || '未填写邮箱'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {screeningResults.has(resume.id) ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            recommendationColors[screeningResults.get(resume.id)!.recommendation]
                          } text-white`}>
                            {screeningResults.get(resume.id)!.score}分
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            未筛选
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                          selectedResumeId === resume.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：AI 筛选结果 */}
        <div className="w-1/2 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              筛选结果
            </h2>
            {selectedResumeId && (
              <button
                onClick={() => handleScreenResume(selectedResumeId)}
                disabled={screeningResumeId === selectedResumeId || !jobRequirements.trim()}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {screeningResumeId === selectedResumeId ? (
                  <Loader2 className="animate-spin w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                重新筛选
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!selectedResume ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="text-purple-400" size={36} />
                </div>
                <p className="text-gray-500 font-medium">请选择一份简历</p>
                <p className="text-gray-400 text-sm mt-1">查看 AI 筛选结果</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 简历基本信息 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    简历信息
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">姓名：</span>{selectedResume.name}
                    </p>
                    {selectedResume.email && (
                      <p className="text-gray-700">
                        <span className="font-medium">邮箱：</span>{selectedResume.email}
                      </p>
                    )}
                    {selectedResume.phone && (
                      <p className="text-gray-700">
                        <span className="font-medium">电话：</span>{selectedResume.phone}
                      </p>
                    )}
                    {selectedResume.summary && (
                      <p className="text-gray-600 text-sm mt-3 pt-3 border-t border-gray-200">
                        <span className="font-medium">摘要：</span>{selectedResume.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI 筛选结果 */}
                {selectedResult ? (
                  <>
                    {/* 推荐结果卡片 */}
                    <div className={`rounded-xl p-5 text-white ${
                      selectedResult.recommendation === 'pass' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                      selectedResult.recommendation === 'reject' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                      'bg-gradient-to-r from-yellow-500 to-orange-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedResult.recommendation === 'pass' ? (
                            <CheckCircle className="w-8 h-8" />
                          ) : selectedResult.recommendation === 'reject' ? (
                            <XCircle className="w-8 h-8" />
                          ) : (
                            <Clock className="w-8 h-8" />
                          )}
                          <div>
                            <p className="text-lg font-semibold">{recommendationLabels[selectedResult.recommendation]}</p>
                            <p className="text-white/80 text-sm">AI 推荐结果</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold">{selectedResult.score}</p>
                          <p className="text-white/80 text-sm">综合评分</p>
                        </div>
                      </div>
                    </div>

                    {/* 评分详情 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{selectedResult.score}</p>
                        <p className="text-sm text-gray-500">综合评分</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedResult.recommendation === 'pass' ? '推荐' : selectedResult.recommendation === 'reject' ? '淘汰' : '待定'}
                        </p>
                        <p className="text-sm text-gray-500">推荐结果</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <MessageSquare className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedResult.reasoning.length > 20 ? '已生成' : '待生成'}
                        </p>
                        <p className="text-sm text-gray-500">评估详情</p>
                      </div>
                    </div>

                    {/* 评估理由 */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        评估理由
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedResult.reasoning || '暂无评估理由'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="text-purple-400" size={28} />
                    </div>
                    <p className="text-gray-500 font-medium">该简历尚未进行 AI 筛选</p>
                    <p className="text-gray-400 text-sm mt-1 mb-4">点击上方"重新筛选"按钮开始筛选</p>
                    <button
                      onClick={() => selectedResumeId && handleScreenResume(selectedResumeId)}
                      disabled={screeningResumeId === selectedResumeId || !jobRequirements.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {screeningResumeId === selectedResumeId ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      开始筛选
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
