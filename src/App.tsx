import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

function App() {
  const [helloResponse, setHelloResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleHelloClick = async () => {
    setLoading(true);
    const res = await axios.get("/api/hello");
    setHelloResponse(res.data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        🚀 We're working on big things!
      </h1>
      <p className="text-lg text-gray-600 mb-4">Let's go</p>
      <Button onClick={handleHelloClick} disabled={loading}>
        {loading ? "Testing..." : "Test /hello API"}
      </Button>
      {helloResponse && (
        <div className="mt-6 p-4 bg-white rounded shadow text-gray-800 w-full max-w-md break-words">
          <pre>{JSON.stringify(helloResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
