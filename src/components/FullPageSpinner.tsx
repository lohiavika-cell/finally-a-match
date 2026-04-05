export function FullPageSpinner({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
      <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
      {message ? <p className="font-mono-space text-sm text-foreground opacity-70 text-center">{message}</p> : null}
    </div>
  );
}
