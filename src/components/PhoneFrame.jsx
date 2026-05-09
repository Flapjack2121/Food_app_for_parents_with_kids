export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-full w-full flex items-stretch justify-center py-0 sm:py-8">
      <div
        className="relative w-full bg-brand-cream flex flex-col overflow-hidden sm:rounded-[44px]"
        style={{
          maxWidth: 390,
          minHeight: '100vh',
          boxShadow: '0 30px 80px rgba(45, 80, 22, 0.18), 0 8px 30px rgba(45, 80, 22, 0.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
