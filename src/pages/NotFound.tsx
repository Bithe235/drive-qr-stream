import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto bg-gradient-primary p-4 rounded-full w-fit mb-6">
          <QrCode className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">404 - Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Button asChild variant="premium" size="lg">
          <Link to="/">Go Back Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;