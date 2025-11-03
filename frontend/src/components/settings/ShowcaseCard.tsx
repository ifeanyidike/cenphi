import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Globe,
  Check,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { workspaceHub } from "@/repo/workspace_hub";
import { showcaseService } from "@/services/showcaseService";

const ShowcaseCard: React.FC = observer(() => {
  const workspace = workspaceHub.workspace;

  const [enabled, setEnabled] = useState(workspace?.showcase_enabled || false);
  const [slug, setSlug] = useState(workspace?.showcase_slug || "");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const showcaseUrl = slug
    ? `${window.location.origin}/showcase/${slug}`
    : "";

  useEffect(() => {
    if (workspace) {
      setEnabled(workspace.showcase_enabled || false);
      setSlug(workspace.showcase_slug || "");
    }
  }, [workspace]);

  const validateSlug = (value: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!value) {
      setSlugError("Slug is required");
      return false;
    }
    if (value.length < 3 || value.length > 100) {
      setSlugError("Slug must be between 3 and 100 characters");
      return false;
    }
    if (!slugRegex.test(value)) {
      setSlugError(
        "Slug can only contain lowercase letters, numbers, and hyphens"
      );
      return false;
    }
    setSlugError(null);
    return true;
  };

  const checkSlugAvailability = async (value: string) => {
    if (!validateSlug(value)) return;

    setCheckingSlug(true);
    setSlugAvailable(null);

    try {
      const available = await showcaseService.checkSlugAvailability(value);
      setSlugAvailable(available);
      if (!available) {
        setSlugError("This slug is already taken");
      }
    } catch (err) {
      console.error("Failed to check slug availability:", err);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  useEffect(() => {
    if (slug.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSlugAvailability(slug);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [slug]);

  const handleSlugChange = (value: string) => {
    const lowerValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(lowerValue);
    setSlugAvailable(null);
    setSlugError(null);
  };

  const handleSave = async () => {
    if (!workspace?.id) return;

    if (enabled && !validateSlug(slug)) {
      return;
    }

    if (enabled && slugAvailable === false) {
      setError("Please choose an available slug");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await showcaseService.updateShowcaseSettings(workspace.id, {
        enabled,
        slug: enabled ? slug : undefined,
        settings: workspace.showcase_settings || {},
      });

      if (workspace) {
        workspace.showcase_enabled = enabled;
        workspace.showcase_slug = enabled ? slug : undefined;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save showcase settings");
    } finally {
      setSaving(false);
    }
  };

  const copyShowcaseUrl = async () => {
    if (!showcaseUrl) return;

    try {
      await navigator.clipboard.writeText(showcaseUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Public Showcase</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Share approved testimonials on a public page
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="space-y-0.5">
            <Label htmlFor="showcase-enabled" className="text-xs font-medium">
              Enable Public Showcase
            </Label>
            <p className="text-[10px] text-gray-500">
              Allow anyone to view your approved testimonials
            </p>
          </div>
          <Switch
            id="showcase-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="showcase-slug" className="text-xs font-medium">
                Showcase URL
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                  <span className="text-[10px] text-gray-500 mr-2">
                    {window.location.origin}/showcase/
                  </span>
                  <Input
                    id="showcase-slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-company"
                    className="border-0 bg-transparent p-0 h-auto text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {checkingSlug && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                )}
                {!checkingSlug && slugAvailable === true && !slugError && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Check className="h-3 w-3" />
                    <span className="text-[10px] font-medium">Available</span>
                  </div>
                )}
                {!checkingSlug && slugAvailable === false && (
                  <div className="flex items-center gap-1 text-rose-600">
                    <X className="h-3 w-3" />
                    <span className="text-[10px] font-medium">Taken</span>
                  </div>
                )}
              </div>
              {slugError && (
                <p className="text-[10px] text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {slugError}
                </p>
              )}
            </div>

            {slug && !slugError && slugAvailable !== false && (
              <Alert className="border-blue-100 bg-blue-50">
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ExternalLink className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    <span className="text-[10px] text-blue-900 truncate">
                      {showcaseUrl}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyShowcaseUrl}
                    className="h-6 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 flex-shrink-0"
                  >
                    {copiedUrl ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="border-rose-200 bg-rose-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-[10px] text-rose-900">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <Check className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-[10px] text-emerald-900">
              Showcase settings saved successfully
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              (enabled &&
                (!slug || slugError !== null || slugAvailable === false))
            }
            className="h-7 px-3 text-[10px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-1.5" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ShowcaseCard;
