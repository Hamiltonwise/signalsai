import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        🚀 We're working on big things!
      </h1>
      <p className="text-lg text-gray-600 mb-4">Let's go</p>
      <Button>Don't Click Me Yet</Button>
    </div>
  );
}

export default App;
