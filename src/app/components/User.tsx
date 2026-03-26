import React, { KeyboardEvent, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Coins,
  GraduationCap,
  Loader2,
  PencilLine,
  Save,
  Tag,
  Trophy,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { User as AppUser } from '../types';

interface ProfileForm {
  id: string;
  name: string;
  initials: string;
  role: string;
  university: string;
  department: string;
  bio: string;
  skills: string[];
  completedProjects: string;
  joinDate: string;
  tokens: string;
}

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

const INPUT_STYLES =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17A2B8]/30 focus:border-[#17A2B8] transition-all bg-[#F5F7FA]';

function buildProfileForm(user: AppUser): ProfileForm {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    role: user.role,
    university: user.university,
    department: user.department,
    bio: user.bio,
    skills: [...user.skills],
    completedProjects: String(user.completedProjects),
    joinDate: user.joinDate,
    tokens: String(user.tokens),
  };
}

function deriveInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return letters || 'U';
}

export function UserProfile() {
  const { user, setTab, updateUserProfile } = useApp();
  const [form, setForm] = useState<ProfileForm>(() => buildProfileForm(user));
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(buildProfileForm(user));
  }, [user]);

  const hasChanges = useMemo(() => {
    const current = buildProfileForm(user);
    return JSON.stringify(current) !== JSON.stringify(form);
  }, [form, user]);

  const updateField = (field: keyof ProfileForm, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaved(false);
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value || form.skills.includes(value)) {
      setSkillInput('');
      return;
    }
    updateField('skills', [...form.skills, value]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    updateField(
      'skills',
      form.skills.filter((item) => item !== skill)
    );
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkill();
    }
  };

  const validate = () => {
    const nextErrors: ProfileErrors = {};
    const tokens = Number(form.tokens);
    const completed = Number(form.completedProjects);

    if (!form.id.trim()) nextErrors.id = 'User ID is required.';
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.role.trim()) nextErrors.role = 'Role is required.';
    if (!form.university.trim()) nextErrors.university = 'University is required.';
    if (!form.department.trim()) nextErrors.department = 'Department is required.';
    if (!form.joinDate.trim()) nextErrors.joinDate = 'Join date is required.';

    if (!form.initials.trim()) nextErrors.initials = 'Initials are required.';
    else if (form.initials.trim().length > 4) nextErrors.initials = 'Use up to 4 characters.';

    if (!form.bio.trim()) nextErrors.bio = 'Bio is required.';
    else if (form.bio.trim().length < 20) nextErrors.bio = 'Bio must be at least 20 characters.';

    if (!Number.isInteger(tokens) || tokens < 0)
      nextErrors.tokens = 'Tokens must be a whole number >= 0.';

    if (!Number.isInteger(completed) || completed < 0)
      nextErrors.completedProjects = 'Completed projects must be a whole number >= 0.';

    if (form.skills.length === 0) nextErrors.skills = 'Add at least one skill.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCancel = () => {
    setForm(buildProfileForm(user));
    setSkillInput('');
    setErrors({});
    setSaved(false);
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    await new Promise((res) => setTimeout(res, 500));

    updateUserProfile({
      id: form.id.trim(),
      name: form.name.trim(),
      initials: form.initials.trim().toUpperCase(),
      role: form.role.trim(),
      tokens: Number(form.tokens),
      university: form.university.trim(),
      department: form.department.trim(),
      bio: form.bio.trim(),
      skills: form.skills,
      completedProjects: Number(form.completedProjects),
      joinDate: form.joinDate.trim(),
    });

    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <UserIcon size={18} className="text-[#17A2B8]" />
          <h1 className="text-2xl font-bold text-[#003D7A]">Manage Profile</h1>
        </div>
        <p className="text-sm text-gray-500">
          Edit your researcher identity, profile details, and account metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div
              className="h-16"
              style={{ background: 'linear-gradient(135deg, #003D7A 0%, #6B4C9A 100%)' }}
            />
            <div className="px-5 pb-5">
              <div className="flex items-end justify-between -mt-8 mb-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-white"
                  style={{ background: 'linear-gradient(135deg, #17A2B8, #6B4C9A)' }}
                >
                  {form.initials || deriveInitials(form.name)}
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <Coins size={13} className="text-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{form.tokens}</span>
                  <span className="text-xs text-amber-500">tokens</span>
                </div>
              </div>

              <h2 className="font-bold text-gray-900">{form.name || 'Your Name'}</h2>
              <p className="text-sm text-[#6B4C9A] font-medium">{form.role || 'Your Role'}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <GraduationCap size={11} />
                {form.university || 'University'} · {form.department || 'Department'}
              </p>

              <p className="text-xs text-gray-500 mt-3 leading-relaxed">{form.bio}</p>

              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.skills.length > 0 ? (
                    form.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 rounded-md font-medium bg-[#003D7A]/8 text-[#003D7A] border border-[#003D7A]/10"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No skills added yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[#003D7A]" />
              <p className="text-sm font-semibold text-gray-800">Profile Metrics</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-xl bg-[#F5F7FA] border border-gray-100">
                <p className="text-base font-bold text-[#003D7A]">{form.completedProjects}</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-[#F5F7FA] border border-gray-100">
                <p className="text-base font-bold text-[#003D7A]">{form.joinDate}</p>
                <p className="text-xs text-gray-400">Joined</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-[#F5F7FA] border border-gray-100">
                <p className="text-base font-bold text-[#003D7A]">{form.tokens}</p>
                <p className="text-xs text-gray-400">Tokens</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab('dashboard')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </aside>

        <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2">
            <PencilLine size={15} className="text-[#003D7A]" />
            <p className="text-sm font-semibold text-gray-800">Profile Details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <BookOpen size={14} className="text-[#003D7A]" />
                User ID
              </label>
              <input
                value={form.id}
                onChange={(e) => updateField('id', e.target.value)}
                className={INPUT_STYLES}
                placeholder="user-1"
              />
              {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <UserIcon size={14} className="text-[#003D7A]" />
                Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={INPUT_STYLES}
                placeholder="Jordan Patel"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Tag size={14} className="text-[#003D7A]" />
                Initials
              </label>
              <div className="flex gap-2">
                <input
                  value={form.initials}
                  onChange={(e) => updateField('initials', e.target.value.toUpperCase())}
                  className={INPUT_STYLES}
                  placeholder="JP"
                />
                <button
                  type="button"
                  onClick={() => updateField('initials', deriveInitials(form.name))}
                  className="px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Auto
                </button>
              </div>
              {errors.initials && <p className="text-red-500 text-xs mt-1">{errors.initials}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Briefcase size={14} className="text-[#003D7A]" />
                Role
              </label>
              <input
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
                className={INPUT_STYLES}
                placeholder="UG Student"
              />
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Building2 size={14} className="text-[#003D7A]" />
                University
              </label>
              <input
                value={form.university}
                onChange={(e) => updateField('university', e.target.value)}
                className={INPUT_STYLES}
                placeholder="University of Cambridge"
              />
              {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <GraduationCap size={14} className="text-[#003D7A]" />
                Department
              </label>
              <input
                value={form.department}
                onChange={(e) => updateField('department', e.target.value)}
                className={INPUT_STYLES}
                placeholder="Computer Science"
              />
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Trophy size={14} className="text-[#003D7A]" />
                Completed Projects
              </label>
              <input
                value={form.completedProjects}
                onChange={(e) => updateField('completedProjects', e.target.value)}
                className={INPUT_STYLES}
                placeholder="0"
                inputMode="numeric"
              />
              {errors.completedProjects && (
                <p className="text-red-500 text-xs mt-1">{errors.completedProjects}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Calendar size={14} className="text-[#003D7A]" />
                Join Date
              </label>
              <input
                value={form.joinDate}
                onChange={(e) => updateField('joinDate', e.target.value)}
                className={INPUT_STYLES}
                placeholder="September 2023"
              />
              {errors.joinDate && <p className="text-red-500 text-xs mt-1">{errors.joinDate}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Coins size={14} className="text-[#003D7A]" />
                Token Balance
              </label>
              <input
                value={form.tokens}
                onChange={(e) => updateField('tokens', e.target.value)}
                className={INPUT_STYLES}
                placeholder="0"
                inputMode="numeric"
              />
              {errors.tokens && <p className="text-red-500 text-xs mt-1">{errors.tokens}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={4}
              className={`${INPUT_STYLES} resize-none`}
              placeholder="Tell collaborators about your focus, interests, and strengths..."
            />
            <div className="flex justify-between mt-1">
              {errors.bio ? (
                <p className="text-red-500 text-xs">{errors.bio}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-400">{form.bio.length} chars</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className={INPUT_STYLES}
                placeholder="Add a skill and press Enter"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 rounded-xl text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                style={{ background: '#003D7A' }}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium text-[#17A2B8] bg-[#17A2B8]/10 border border-[#17A2B8]/20"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                    aria-label={`Remove ${skill}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            {errors.skills && <p className="text-red-500 text-xs mt-1">{errors.skills}</p>}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-gray-400">
              {saved ? 'Profile saved successfully.' : hasChanges ? 'Unsaved changes.' : 'All changes saved.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving || !hasChanges}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #003D7A, #6B4C9A)' }}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
