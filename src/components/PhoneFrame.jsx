export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-full w-full flex items-stretch justify-center bg-[#efe7d8] py-0 sm:py-8">
      <div
        className="relative w-full bg-brand-cream shadow-xl flex flex-col overflow-hidden sm:rounded-[40px]"
        style={{ maxWidth: 390, minHeight: '100vh' }}
      >
        {children}
      </div>
    </div>
  );
}
