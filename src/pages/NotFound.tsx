import { useNavigate } from "react-router";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-9xl font-bold text-primary">404</div>
      <div className="text-4xl font-bold text-foreground">Page Not Found</div>

      <button
        onClick={() => navigate("/")}
        className="mt-12 px-8 py-3 rounded-xl bg-primary text-foreground font-bold 
        hover:bg-primary transition-all duration-200 hover:scale-105 
        hover:shadow-lg hover:shadow-primary/30 active:scale-95"
      >
        Go to Home
      </button>
    </div>
  );
};

export default NotFound;
