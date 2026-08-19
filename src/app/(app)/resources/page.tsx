"use client";

import { useEffect, useState } from "react";
import { ExternalLink, BookOpen } from "lucide-react";

interface QuickLink {
  id: string;
  title: string;
  url: string;
  description: string;
}

export default function ResourcesPage() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quick-links")
      .then((r) => r.json())
      .then((data) => setLinks(data.links ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-2">Resources</h1>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-2">Resources</h1>
      <p className="text-spotify-subtext text-sm mb-8">
        Quick links and useful resources for the CS team.
      </p>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-spotify-green" />
          Quick Links
        </h2>

        {links.length === 0 ? (
          <div className="bg-spotify-card rounded-container border border-spotify-border p-8 text-center">
            <BookOpen size={28} className="text-spotify-subtext mx-auto mb-3" />
            <p className="text-sm text-white font-medium mb-1">No resources added yet</p>
            <p className="text-xs text-spotify-subtext">
              Admins can add links from the Admin panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-spotify-card rounded-card border border-spotify-border p-5 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20 transition-all duration-200 flex flex-col"
              >
                <h3 className="text-sm font-semibold text-white mb-1">{link.title}</h3>
                {link.description && (
                  <p className="text-xs text-spotify-subtext mb-3 flex-1 line-clamp-2">
                    {link.description}
                  </p>
                )}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-card bg-spotify-green/15 text-spotify-green hover:bg-spotify-green/25 transition-colors w-fit mt-auto"
                >
                  <ExternalLink size={12} />
                  Open
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
