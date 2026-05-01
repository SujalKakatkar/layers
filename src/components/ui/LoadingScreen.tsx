
const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-500">
      <div className="flex flex-col items-center">
        {/* Animated Logo Text */}
        <h1 className="text-2xl md:text-6xl font-black text-emerald-500">
          Layer
        </h1>

      </div>
    </div>
  );
};

export default LoadingScreen;
