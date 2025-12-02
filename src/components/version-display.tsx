'use client';

export function VersionDisplay() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'local';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

  const envColors = {
    production: 'bg-green-600/80 text-white',
    staging: 'bg-orange-500/80 text-white',
    development: 'bg-blue-500/80 text-white',
  };

  const colorClass = envColors[environment as keyof typeof envColors] || envColors.development;

  const shortHash = commitHash.substring(0, 7);
  const formattedBuildTime = new Date(buildTime).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div 
      className={`fixed bottom-4 right-4 px-3 py-1.5 rounded-md shadow-lg text-xs font-mono ${colorClass} hover:opacity-100 opacity-70 transition-opacity z-50`}
      title={`Full commit: ${commitHash}\nBuild: ${buildTime}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">{environment}</span>
        <span>v{version}</span>
        <span>#{shortHash}</span>
        <span className="text-[10px] opacity-80">{formattedBuildTime}</span>
      </div>
    </div>
  );
}
