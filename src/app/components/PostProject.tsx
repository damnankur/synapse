import React, { useState, KeyboardEvent, useMemo } from 'react';
import {
  PlusCircle,
  X,
  Loader2,
  Coins,
  BookOpen,
  Tag,
  Users,
  FileText,
  ChevronDown,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../store/AppContext';

const DOMAIN_SUGGESTIONS = [
  'Computer Science / AI',
  'Computer Science / Psychology',
  'Environmental Science / ML',
  'Computer Science / Law / Education',
  'Organisational Psychology / Data Science',
  'Electrical Engineering / Sustainability',
  'Bioethics / Molecular Biology',
  'Physics / Biochemistry',
  'Economics / Political Science',
  'Neuroscience / Computer Science',
  'Mathematics / Finance',
  'Public Health / Data Science',
];

const ROLE_SUGGESTIONS = [
  'ML Engineer',
  'Data Scientist',
  'UX Researcher',
  'Backend Developer',
  'Frontend Developer',
  'Statistical Analyst',
  'Domain Expert',
  'Science Communicator',
  'Legal Researcher',
  'Project Manager',
  'Bioethicist',
  'GIS Specialist',
];

interface FormState {
  title: string;
  domain: string;
  description: string;
  roleInput: string;
  roleCountInput: string;
  requiredRoles: string[];
  tagInput: string;
  tags: string[];
}

export function PostProject() {
  const { publishProject, isPublishing, user, setTab } = useApp();
  const [published, setPublished] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showDomainSuggestions, setShowDomainSuggestions] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: '',
    domain: '',
    description: '',
    roleInput: '',
    roleCountInput: '1',
    requiredRoles: [],
    tagInput: '',
    tags: [],
  });

  const update = (field: keyof FormState, value: string | string[]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const clearError = (field: keyof FormState) =>
    setErrors((e) => { const next = { ...e }; delete next[field]; return next; });

  // Add role tag
  const addRole = () => {
    const trimmed = form.roleInput.trim();
    if (!trimmed) return;
    const requestedCount = Number.parseInt(form.roleCountInput, 10);
    const roleCount = Number.isFinite(requestedCount)
      ? Math.min(Math.max(requestedCount, 1), 20)
      : 1;

    setForm((f) => ({
      ...f,
      requiredRoles: [
        ...f.requiredRoles,
        ...Array.from({ length: roleCount }, () => trimmed),
      ],
      roleInput: '',
      roleCountInput: '1',
    }));
    clearError('requiredRoles');
  };

  const removeRole = (role: string) =>
    setForm((f) => {
      const index = f.requiredRoles.findIndex((entry) => entry === role);
      if (index === -1) return f;
      const nextRoles = [...f.requiredRoles];
      nextRoles.splice(index, 1);
      return { ...f, requiredRoles: nextRoles };
    });

  const roleDemandEntries = useMemo(() => {
    const demandMap = form.requiredRoles.reduce((acc, role) => {
      acc.set(role, (acc.get(role) || 0) + 1);
      return acc;
    }, new Map<string, number>());
    return Array.from(demandMap.entries());
  }, [form.requiredRoles]);

  const addTag = () => {
    const trimmed = form.tagInput.trim();
    if (!trimmed || form.tags.includes(trimmed)) {
      setForm((f) => ({ ...f, tagInput: '' }));
      return;
    }
    setForm((f) => ({ ...f, tags: [...f.tags, trimmed], tagInput: '' }));
  };

  const removeTag = (tag: string) =>
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Project title is required.';
    if (form.title.trim().length > 0 && form.title.trim().length < 10)
      newErrors.title = 'Title must be at least 10 characters.';
    if (!form.domain.trim()) newErrors.domain = 'Research domain is required.';
    if (!form.description.trim()) newErrors.description = 'Description is required.';
    if (form.description.trim().length > 0 && form.description.trim().length < 50)
      newErrors.description = 'Description must be at least 50 characters.';
    if (form.requiredRoles.length === 0)
      newErrors.requiredRoles = 'Add at least one required role.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await publishProject({
        title: form.title,
        domain: form.domain,
        description: form.description,
        requiredRoles: form.requiredRoles,
        tags: form.tags,
      });
      setPublished(true);
    } catch (_error) {
      // Error toast is handled centrally in AppContext.publishProject.
    }
  };

  if (published) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #17A2B8, #003D7A)' }}
        >
          <CheckCircle2 size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#003D7A] mb-2">Project Published!</h2>
        <p className="text-gray-500 mb-1">
          <span className="font-semibold text-gray-700">"{form.title}"</span> is now live in the
          Discover feed.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Researchers will be able to apply. You were charged 10 tokens.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setPublished(false);
              setForm({
                title: '',
                domain: '',
                description: '',
                roleInput: '',
                roleCountInput: '1',
                requiredRoles: [],
                tagInput: '',
                tags: [],
              });
            }}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Post Another
          </button>
          <button
            onClick={() => setTab('feed')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity shadow-md"
            style={{ background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }}
          >
            View in Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <PlusCircle size={18} className="text-[#17A2B8]" />
          <h1 className="text-2xl font-bold text-[#003D7A]">Post a Research Project</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Attract skilled collaborators. Publishing costs{' '}
          <span className="font-semibold text-[#6B4C9A]">10 tokens</span> — your commitment to the
          research community.
        </p>
      </div>

      {/* Token warning */}
      {user.tokens < 10 && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <Coins size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Insufficient Balance</p>
            <p className="text-xs text-red-500 mt-0.5">
              You need 10 tokens to publish. Complete active role tasks to earn more.
            </p>
          </div>
        </div>
      )}

      {/* Hint banner */}
      <div className="mb-6 flex items-start gap-3 bg-[#F5F7FA] border border-[#003D7A]/10 rounded-xl p-4">
        <Lightbulb size={16} className="text-[#17A2B8] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Pro tip:</span> Be specific about required
          roles. Projects with 3–5 clearly-defined roles attract 2× more qualified applicants.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

        {/* Title */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <FileText size={14} className="text-[#003D7A]" />
            Project Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => { update('title', e.target.value); clearError('title'); }}
            placeholder="e.g. AI-Powered Early Cancer Detection via Biomarkers"
            className={`
              w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-400
              focus:outline-none focus:ring-2 transition-all bg-[#F5F7FA]
              ${errors.title
                ? 'border-red-300 focus:ring-red-200'
                : 'border-gray-200 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8]'
              }
            `}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Domain */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <BookOpen size={14} className="text-[#003D7A]" />
            Research Domain <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.domain}
              onChange={(e) => { update('domain', e.target.value); clearError('domain'); setShowDomainSuggestions(true); }}
              onFocus={() => setShowDomainSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDomainSuggestions(false), 150)}
              placeholder="e.g. Neuroscience / Computer Science"
              className={`
                w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-400
                focus:outline-none focus:ring-2 transition-all bg-[#F5F7FA] pr-10
                ${errors.domain
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-200 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8]'
                }
              `}
            />
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {errors.domain && <p className="text-red-500 text-xs mt-1">{errors.domain}</p>}
          {showDomainSuggestions && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
              {DOMAIN_SUGGESTIONS.filter((d) =>
                d.toLowerCase().includes(form.domain.toLowerCase())
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  onMouseDown={() => { update('domain', suggestion); clearError('domain'); setShowDomainSuggestions(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors first:rounded-t-xl last:rounded-b-xl cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <FileText size={14} className="text-[#003D7A]" />
            Project Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => { update('description', e.target.value); clearError('description'); }}
            placeholder="Describe your research goals, methods, expected outcomes, and what collaborators will contribute…"
            rows={5}
            className={`
              w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-400 resize-none
              focus:outline-none focus:ring-2 transition-all bg-[#F5F7FA]
              ${errors.description
                ? 'border-red-300 focus:ring-red-200'
                : 'border-gray-200 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8]'
              }
            `}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description ? (
              <p className="text-red-500 text-xs">{errors.description}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-gray-400 text-right">{form.description.length} chars</p>
          </div>
        </div>

        {/* Required Roles */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <Users size={14} className="text-[#003D7A]" />
            Roles Needed <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={form.roleInput}
                onChange={(e) => update('roleInput', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, addRole)}
                placeholder="e.g. ML Engineer"
                list="role-suggestions"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all bg-[#F5F7FA]"
              />
              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
            <input
              type="number"
              min={1}
              max={20}
              value={form.roleCountInput}
              onChange={(e) => update('roleCountInput', e.target.value)}
              className="w-24 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all bg-[#F5F7FA]"
              aria-label="Number of contributors for this role"
            />
            <button
              onClick={addRole}
              className="px-3 py-2.5 rounded-xl text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
              style={{ background: '#003D7A' }}
            >
              <PlusCircle size={16} />
            </button>
          </div>
          {roleDemandEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {roleDemandEntries.map(([role, count]) => (
                <span
                  key={role}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }}
                >
                  {role} {count > 1 ? `x${count}` : ''}
                  <button
                    onClick={() => removeRole(role)}
                    className="hover:text-red-200 transition-colors cursor-pointer"
                    aria-label={`Remove one ${role} slot`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              No roles added yet. Pick a role, set count, then add.
            </p>
          )}
          {form.requiredRoles.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-2">
              Total contributor slots requested: {form.requiredRoles.length}
            </p>
          )}
          {errors.requiredRoles && (
            <p className="text-red-500 text-xs mt-1">{errors.requiredRoles}</p>
          )}
        </div>

        {/* Tags (optional) */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
            <Tag size={14} className="text-[#003D7A]" />
            Tags{' '}
            <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={form.tagInput}
              onChange={(e) => update('tagInput', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, addTag)}
              placeholder="e.g. Python, LLM — press Enter to add"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all bg-[#F5F7FA]"
            />
            <button
              onClick={addTag}
              className="px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors flex-shrink-0 border border-gray-200 text-gray-600"
            >
              <PlusCircle size={16} />
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium text-[#17A2B8] bg-[#17A2B8]/10 border border-[#17A2B8]/20"
                >
                  <Tag size={9} />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Coins size={14} className="text-amber-500" />
              <span>
                Publishing cost:{' '}
                <span className="font-bold text-gray-700">10 tokens</span>
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Balance after:{' '}
              <span
                className={`font-bold ${user.tokens - 10 < 0 ? 'text-red-600' : 'text-[#003D7A]'}`}
              >
                {user.tokens - 10} tokens
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPublishing || user.tokens < 10}
            className={`
              w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
              text-sm font-semibold text-white transition-all duration-200 cursor-pointer shadow-md
              ${isPublishing || user.tokens < 10
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90 active:scale-[0.99] hover:shadow-lg'
              }
            `}
            style={{ background: 'linear-gradient(135deg, #003D7A 0%, #6B4C9A 100%)' }}
          >
            {isPublishing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Publishing to Feed…
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Publish Project · 10 tokens
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
