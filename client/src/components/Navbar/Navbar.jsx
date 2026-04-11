import { Button } from "@/components/ui/button";
import { Upload, PlusCircle, LogOut } from "lucide-react";

const Navbar = (args) => {
  const handleAddCoursesButtonOnClick = () => {
    args.setAddCoursesButton(true);
  };

  const handleContributeButtonOnClick = () => {
    window.location.href = "/upload";
  };

  const handleLogout = async () => {
    window.location.href = "/logout";
  };

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            P
          </div>
          <span className="truncate font-bold text-lg text-foreground">
            Prep Hub
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handleContributeButtonOnClick}
          >
            <Upload className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Contribute</span>
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={handleAddCoursesButtonOnClick}
          >
            <PlusCircle className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Add courses</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-foreground/80"
            onClick={handleLogout}
          >
            <LogOut className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
