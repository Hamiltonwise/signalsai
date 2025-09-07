import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface PMSUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
}

interface PMSRecord {
  date: string;
  referral_type: string; // 'Self-Referral', 'Doctor-Referral', 'Other'
  referral_source?: string;
  production_amount: number;
  appointment_type?: string;
  treatment_category?: string;
  notes?: string;
}

export const PMSUploadModal: React.FC<PMSUploadModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [csvData, setCsvData] = useState<PMSRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Reset modal state when it opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setCsvData([]);
      setError(null);
      setUploadResult(null);
      setStep("upload");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv")
      ) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        console.log(
          "PMSUploadModal: Raw CSV text loaded (first 500 chars):",
          text.substring(0, 500) + "..."
        ); // Log first 500 characters

        const lines = text
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#"));
        console.log(
          "PMSUploadModal: CSV lines after filtering:",
          lines.length,
          "lines"
        );
        if (lines.length > 0) {
          console.log("PMSUploadModal: First line (headers):", lines[0]);
        }

        if (lines.length === 0) {
          setError("CSV file is empty");
          return;
        }

        // More robust CSV parsing that handles quoted fields
        const parseCSVLine = (line: string): string[] => {
          const result = [];
          let current = "";
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }

          result.push(current.trim());
          return result;
        };

        // Function to parse and convert various date formats to YYYY-MM-DD
        const parseAndConvertDate = (dateStr: string): string | null => {
          if (!dateStr || dateStr.trim() === "") return null;

          const cleanDate = dateStr.trim().replace(/^"|"$/g, ""); // Remove quotes

          // Try different date formats
          const formats = [
            // MM/DD/YY or MM-DD-YY
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
            // MM/DD/YYYY or MM-DD-YYYY
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
            // YYYY-MM-DD (already correct format)
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
            // YYYY/MM/DD
            /^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/,
          ];

          for (let i = 0; i < formats.length; i++) {
            const match = cleanDate.match(formats[i]);
            if (match) {
              let year, month, day;

              if (i === 0) {
                // MM/DD/YY or MM-DD-YY
                month = match[1].padStart(2, "0");
                day = match[2].padStart(2, "0");
                year = parseInt(match[3]);
                // Convert 2-digit year to 4-digit (assume 20xx for years 00-99)
                year = year < 50 ? 2000 + year : 1900 + year;
              } else if (i === 1) {
                // MM/DD/YYYY or MM-DD-YYYY
                month = match[1].padStart(2, "0");
                day = match[2].padStart(2, "0");
                year = parseInt(match[3]);
              } else if (i === 2) {
                // YYYY-MM-DD (already correct)
                year = parseInt(match[1]);
                month = match[2].padStart(2, "0");
                day = match[3].padStart(2, "0");
              } else if (i === 3) {
                // YYYY/MM/DD
                year = parseInt(match[1]);
                month = match[2].padStart(2, "0");
                day = match[3].padStart(2, "0");
              }

              const convertedDate = `${year}-${month}-${day}`;
              console.log(
                `PMSUploadModal: Converted "${cleanDate}" to "${convertedDate}"`
              );
              return convertedDate;
            }
          }
          console.log("PMSUploadModal: No date format matched for:", cleanDate);
          return null;
        };

        const headers = parseCSVLine(lines[0]).map((h) =>
          h.trim().toLowerCase()
        );
        console.log("PMSUploadModal: Parsed headers:", headers);

        // Validate headers
        const requiredHeaders = ["date", "referral_type", "production_amount"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(", ")}`);
          return;
        }
        // Enhanced header mapping with flexible matching
        const createFlexibleHeaderMap = (headers: string[]) => {
          const headerMap: { [key: string]: string } = {};

          headers.forEach((header) => {
            const cleanHeader = header.toLowerCase().trim();

            // Direct matches with more variations
            if (cleanHeader === "date") headerMap[header] = "date";
            else if (
              cleanHeader === "referral_type" ||
              cleanHeader === "referraltype" ||
              cleanHeader === "referral type"
            ) {
              headerMap[header] = "referral_type";
            } else if (
              cleanHeader === "referral_source" ||
              cleanHeader === "referralsource" ||
              cleanHeader === "referral source"
            ) {
              headerMap[header] = "referral_source";
            } else if (
              cleanHeader === "production_amount" ||
              cleanHeader === "productionamount" ||
              cleanHeader === "production amount" ||
              cleanHeader === "production"
            ) {
              headerMap[header] = "production_amount";
            } else if (
              cleanHeader === "appointment_type" ||
              cleanHeader === "appointmenttype" ||
              cleanHeader === "appointment type"
            )
              headerMap[header] = "appointment_type";
            else if (
              cleanHeader === "treatment_category" ||
              cleanHeader === "treatmentcategory" ||
              cleanHeader === "treatment category"
            )
              headerMap[header] = "treatment_category";
            else if (cleanHeader === "notes" || cleanHeader === "note")
              headerMap[header] = "notes";
          });

          return headerMap;
        };

        const headerMap = createFlexibleHeaderMap(headers);

        const data: PMSRecord[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          console.log(`PMSUploadModal: Processing row ${i + 1}:`, lines[i]);
          const values = parseCSVLine(lines[i]).map((v) =>
            v.trim().replace(/^"|"$/g, "")
          ); // Remove surrounding quotes
          const record: any = {};

          headers.forEach((header, index) => {
            const key = headerMap[header];
            if (key && values[index] !== undefined) {
              // Store the actual value, not empty strings
              const value = values[index]?.trim();
              record[key] = value && value !== "" ? value : null;
            }
          });

          // Parse and convert date
          const convertedDate = parseAndConvertDate(record.date as string);
          if (!convertedDate) {
            errors.push(
              `Row ${i + 1}: Invalid date format "${
                record.date
              }". Supported formats: MM/DD/YY, MM-DD-YY, MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD`
            );
            continue;
          }

          const referralType = record.referral_type;
          const productionAmount =
            parseFloat(record.production_amount as any) || 0;

          // Validate referral_type (any non-empty text up to 100 characters)
          const trimmedReferralType = referralType?.toString().trim();

          // Normalize referral_type to match database constraint values
          const normalizeReferralType = (type: string): string => {
            const normalized = type.toLowerCase().trim();

            // Map common variations to database values
            if (normalized.includes("doctor") || normalized.includes("dr.")) {
              return "doctor_referral";
            } else if (normalized.includes("self")) {
              return "self_referral";
            } else if (normalized.includes("insurance")) {
              return "insurance_referral";
            } else if (normalized.includes("emergency")) {
              return "emergency";
            } else {
              return "other";
            }
          };

          if (!trimmedReferralType) {
            errors.push(`Row ${i + 1}: Referral_Type cannot be empty`);
            continue;
          }
          if (trimmedReferralType.length > 100) {
            errors.push(
              `Row ${i + 1}: Referral_Type too long (max 100 characters)`
            );
            continue;
          }

          const normalizedReferralType =
            normalizeReferralType(trimmedReferralType);

          const processedRecord = {
            date: convertedDate,
            referral_type: normalizedReferralType,
            referral_source: record.referral_source || null,
            production_amount: productionAmount,
            appointment_type: record.appointment_type || null,
            treatment_category: record.treatment_category || null,
            notes: record.notes || null,
          };
          console.log(
            `PMSUploadModal: Processed record for row ${i + 1}:`,
            processedRecord
          );

          data.push(processedRecord);
        }

        if (errors.length > 0) {
          console.error("PMSUploadModal: Validation errors found:", errors);
          setError(errors.join("\n"));
          return;
        }

        setCsvData(data);
        setStep("preview");
      } catch (err) {
        console.error("PMSUploadModal: Error during CSV parsing:", err);
        setError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvData.length) return;

    setIsUploading(true);
    setError(null);

    try {
      // The csvData is already in the correct format for the backend

      const response = await fetch(`${SUPABASE_URL}/functions/v1/pms-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        // Send the raw parsed CSV data directly to the Edge Function
        body: JSON.stringify({ clientId, csvData }), // Wrap csvData in an object with clientId
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Upload failed");
      }

      setUploadResult(result);
      setStep("success");

      // Don't auto-close, let user click the button to proceed
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Date,Referral_Type,Referral_Source,Production_Amount,Appointment_Type,Treatment_Category,Notes
01/15/24,Self-Referral,Google Search,350.00,New Patient Exam,General Dentistry,Patient found us via online search.
01/20/24,Doctor-Referral,Dr. Emily White,750.50,Consultation,Endodontic,Referred for root canal evaluation.
02/01/24,Self-Referral,Friend Referral,200.00,Recall,Orthodontic,Existing patient referred a friend.
02/10/24,Doctor-Referral,Dr. Clark Kent,1200.00,New Patient Exam,Orthodontic,Referred for braces.
03/05/24,Self-Referral,Social Media,400.00,Emergency,General Dentistry,Saw our ad on Instagram.
03/12/24,Doctor-Referral,Dr. Bruce Banner,900.00,Follow-up,Endodontic,Post-op check.
03/15/24,Insurance,Aetna PPO,650.00,New Patient Exam,General Dentistry,Insurance network referral.
03/20/24,Emergency,Walk-in,300.00,Emergency,General Dentistry,Emergency walk-in patient.
04/01/24,Specialist Referral,Dr. Sarah Johnson,1100.00,Consultation,Orthodontic,Orthodontist referral.
04/05/24,Online Booking,Website,450.00,Cleaning,General Dentistry,Booked through online portal.`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pms_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setFile(null);
    setCsvData([]);
    setError(null);
    setUploadResult(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Early return after all hooks are called
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Upload PMS Data</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {step === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Practice Management Data
                </h3>
                <p className="text-gray-600">
                  Upload your monthly referral data to track practice growth and
                  patient acquisition trends.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">
                      CSV Format Requirements
                    </h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>
                        <strong>Required columns:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>
                          <code>Date</code> - Formats: MM/DD/YY, MM-DD-YY,
                          MM/DD/YYYY, or YYYY-MM-DD (e.g., 01/15/24 or
                          2024-01-15)
                        </li>
                        <li>
                          <code>Referral_Type</code> - Any text describing the
                          referral source (e.g., 'Self-Referral', 'Dr. Smith',
                          'Insurance', etc.)
                        </li>
                        <li>
                          <code>Production_Amount</code> - Numeric value (e.g.,
                          350.00)
                        </li>
                      </ul>
                      <p>
                        <strong>Optional columns:</strong>
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>
                          <code>Referral_Source</code>,{" "}
                          <code>Appointment_Type</code>,{" "}
                          <code>Treatment_Category</code>, <code>Notes</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Template */}
              <div className="flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {file ? file.name : "Choose CSV file"}
                </p>
                <p className="text-gray-600 mb-4">
                  {file
                    ? "File selected. Click below to continue."
                    : "Select a CSV file to upload your PMS data"}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {file ? "Choose Different File" : "Select File"}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-1">
                        Upload Error
                      </h4>
                      <pre className="text-sm text-red-800 whitespace-pre-wrap">
                        {error}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Preview Data
                </h3>
                <p className="text-gray-600">
                  Review your data before uploading. Found {csvData.length}{" "}
                  records.
                </p>
              </div>

              {/* Data Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Data Preview</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">
                          Referral Type
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">
                          Referral Source
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">
                          Production
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">
                          Appt. Type
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">
                          Treatment
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((record, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2">{record.date}</td>
                          <td className="px-4 py-2">{record.referral_type}</td>
                          <td className="px-4 py-2">
                            {record.referral_source || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {record.production_amount
                              ? `$${record.production_amount.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}`
                              : "-"}
                          </td>
                          <td className="px-4 py-2">
                            {record.appointment_type || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {record.treatment_category || "-"}
                          </td>
                          <td className="px-4 py-2">{record.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("upload")}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? "Uploading..." : "Upload Data"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Upload Successful!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your PMS data has been uploaded and processed successfully.
                </p>
                {uploadResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-green-800">
                      <p>
                        <strong>Records processed:</strong>{" "}
                        {uploadResult.data?.recordsProcessed || 0}
                      </p>
                      <p>
                        <strong>Records stored:</strong>{" "}
                        {uploadResult.data?.recordsStored || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Data successfully integrated into dashboard
                  </span>
                </div>
                <button
                  onClick={() => {
                    onSuccess?.();
                    onClose();
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Updated Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
