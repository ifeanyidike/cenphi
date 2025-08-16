// // components/ai-studio/Studio.tsx
// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { AnimatePresence } from "framer-motion";
// import {
//   Clock,
//   AlertCircle,
//   Download,
//   Share2,
//   Eye,
//   Target,
//   Workflow,
//   Trash2,
//   RotateCcw,
// } from "lucide-react";
// import { ProcessingJob, StreamingResult } from "./types";
// import { AI_SERVICES } from "./definitions";
// import ServiceConfigPage from "./service-config";
// import MarkdownRenderer from "./MarkdownRenderer";
// import Toast from "./Toast";
// import Services from "./Services";

// // API Configuration
// const API_BASE_URL = import.meta.env.VITE_API_URL;
// // Main AI Studio Component
// const AIStudio: React.FC = () => {
//   const [selectedTestimonials] = useState<string[]>([]);
//   const [activeTab, setActiveTab] = useState("testimonials");
//   const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
//   const [streamingResults, setStreamingResults] = useState<
//     Record<string, StreamingResult>
//   >({});
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [toast, setToast] = useState<any>(null);
//   const [currentConfigService, setCurrentConfigService] = useState<any>(null);
//   const [savedPresets, setSavedPresets] = useState<Record<string, any[]>>({});
//   const [defaultPresets, setDefaultPresets] = useState<Record<string, any>>({});

//   // SSE and WebSocket connections
//   const eventSourceRef = useRef<EventSource | null>(null);
//   const streamingConnectionsRef = useRef<Record<string, EventSource>>({});
//   const mountedRef = useRef(true);

//   // Initialize SSE connection
//   const initializeSSE = useCallback(() => {
//     if (eventSourceRef.current) {
//       eventSourceRef.current.close();
//     }

//     const eventSource = new EventSource(`${API_BASE_URL}/jobs/stream`);
//     eventSourceRef.current = eventSource;

//     eventSource.onopen = () => {
//       console.log("✅ SSE connection established");
//     };

//     eventSource.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("📨 SSE event received:", data);

//         if (data.job_id && data.service_id) {
//           handleJobStatusUpdate(data.service_id, data);
//         }
//       } catch (error) {
//         console.error("Error parsing SSE data:", error);
//       }
//     };

//     eventSource.addEventListener("job_completed", (event) => {
//       try {
//         const data = JSON.parse((event as any).data);
//         console.log("✅ Job completed:", data);
//         handleJobCompletion(data.service_id, data);
//       } catch (error) {
//         console.error("Error parsing job completion data:", error);
//       }
//     });

//     eventSource.addEventListener("job_failed", (event) => {
//       try {
//         const data = JSON.parse((event as any).data);
//         console.log("❌ Job failed:", data);
//         handleJobFailure(data.service_id, data);
//       } catch (error) {
//         console.error("Error parsing job failure data:", error);
//       }
//     });

//     eventSource.onerror = (error) => {
//       console.error("❌ SSE connection error:", error);
//       setTimeout(() => {
//         if (mountedRef.current) {
//           initializeSSE();
//         }
//       }, 5000);
//     };
//   }, []);

//   // Handle job status updates from SSE
//   const handleJobStatusUpdate = useCallback((serviceId: string, data: any) => {
//     if (!mountedRef.current) return;

//     setProcessingJobs((prev) =>
//       prev.map((job) =>
//         job.serviceId === serviceId
//           ? { ...job, ...data, status: data.status || job.status }
//           : job
//       )
//     );
//   }, []);

//   // Handle job completion from SSE
//   const handleJobCompletion = useCallback((serviceId: string, data: any) => {
//     if (!mountedRef.current) return;

//     setProcessingJobs((prev) =>
//       prev.map((job) =>
//         job.serviceId === serviceId
//           ? {
//               ...job,
//               status: "completed",
//               progress: 100,
//               result: data.result || data,
//               endTime: new Date(),
//             }
//           : job
//       )
//     );
//   }, []);

//   // Handle job failure from SSE
//   const handleJobFailure = useCallback((serviceId: string, data: any) => {
//     if (!mountedRef.current) return;

//     setProcessingJobs((prev) =>
//       prev.map((job) =>
//         job.serviceId === serviceId
//           ? {
//               ...job,
//               status: "failed",
//               error: data.error || "Job failed",
//               endTime: new Date(),
//             }
//           : job
//       )
//     );
//   }, []);

//   // Initialize streaming connection for a specific service
//   const initializeStreamingConnection = useCallback((serviceId: string) => {
//     if (streamingConnectionsRef.current[serviceId]) {
//       streamingConnectionsRef.current[serviceId].close();
//     }

//     const streamingEventSource = new EventSource(
//       `${API_BASE_URL}${AI_SERVICES.find((s) => s.id === serviceId)?.endpoint}/stream`
//     );
//     streamingConnectionsRef.current[serviceId] = streamingEventSource;

//     streamingEventSource.onopen = () => {
//       console.log(`✅ Streaming connection established for ${serviceId}`);
//     };

//     streamingEventSource.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log(`📨 Streaming data received for ${serviceId}:`, data);

//         if (data.type === "chunk") {
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               content: (prev[serviceId]?.content || "") + data.content,
//               isComplete: false,
//               isStreaming: true,
//               type: data.content_type || "text",
//             },
//           }));
//         } else if (data.type === "complete") {
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               ...prev[serviceId],
//               isComplete: true,
//               isStreaming: false,
//             },
//           }));
//         } else if (data.type === "error") {
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               ...prev[serviceId],
//               isComplete: true,
//               isStreaming: false,
//             },
//           }));
//         }
//       } catch (error) {
//         console.error(`Error parsing streaming data for ${serviceId}:`, error);
//       }
//     };

//     streamingEventSource.onerror = (error) => {
//       console.error(`❌ Streaming connection error for ${serviceId}:`, error);
//       setStreamingResults((prev) => ({
//         ...prev,
//         [serviceId]: {
//           ...prev[serviceId],
//           isComplete: true,
//           isStreaming: false,
//         },
//       }));
//     };

//     return streamingEventSource;
//   }, []);

//   // Handle processing
//   const handleProcessImmediate = (serviceId: string) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     const config =
//       defaultPresets[serviceId]?.config || service?.defaultSettings;
//     processService(serviceId, config);
//   };

//   const handleCustomizeProcess = (serviceId: string) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     setCurrentConfigService(service);
//   };

//   const processService = async (serviceId: string, config: any) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     if (!service) return;

//     const startTime = Date.now();

//     // Create job
//     const newJob: ProcessingJob = {
//       id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       serviceId,
//       testimonialIds: selectedTestimonials,
//       status: service.supportsStreaming
//         ? "streaming"
//         : service.isQueued
//           ? "queued"
//           : "processing",
//       progress: 0,
//       startTime: new Date(),
//       config,
//     };

//     setProcessingJobs((prev) => [...prev, newJob]);
//     setCurrentConfigService(null);
//     setActiveTab("processing");

//     // Show toast notification
//     setToast({
//       message: `Processing started for ${service.title}. Estimated time: ${service.estimatedTime}`,
//       action: "View Progress",
//       onAction: () => {
//         setActiveTab("processing");
//         setToast(null);
//       },
//       onClose: () => setToast(null),
//     });

//     try {
//       // Prepare request payload
//       const payload = {
//         testimonial_ids: selectedTestimonials,
//         workspace_id: "test-workspace-id", // Replace with actual workspace ID
//         ...config,
//       };

//       if (service.supportsStreaming) {
//         // Set up streaming
//         setStreamingResults((prev) => ({
//           ...prev,
//           [serviceId]: {
//             content: "",
//             isComplete: false,
//             isStreaming: true,
//             type: service.id === "content_generator" ? "markdown" : "text",
//           },
//         }));

//         // For streaming services, we'll use fetch with streaming response
//         const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }

//         // Handle streaming response
//         if (response.body) {
//           const reader = response.body.getReader();
//           const decoder = new TextDecoder();

//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;

//             const chunk = decoder.decode(value, { stream: true });
//             setStreamingResults((prev) => ({
//               ...prev,
//               [serviceId]: {
//                 ...prev[serviceId],
//                 content: (prev[serviceId]?.content || "") + chunk,
//               },
//             }));
//           }

//           // Mark as complete
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               ...prev[serviceId],
//               isComplete: true,
//               isStreaming: false,
//             },
//           }));

//           // Update job status
//           setProcessingJobs((prev) =>
//             prev.map((job) =>
//               job.id === newJob.id
//                 ? {
//                     ...job,
//                     status: "completed",
//                     progress: 100,
//                     endTime: new Date(),
//                   }
//                 : job
//             )
//           );
//         }
//       } else {
//         // Non-streaming service
//         const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }

//         const result = await response.json();

//         if (service.isQueued) {
//           // Queued job - will be handled by SSE
//           setProcessingJobs((prev) =>
//             prev.map((job) =>
//               job.id === newJob.id
//                 ? { ...job, id: result.job_id || job.id, status: "queued" }
//                 : job
//             )
//           );
//         } else {
//           // Immediate result
//           setProcessingJobs((prev) =>
//             prev.map((job) =>
//               job.id === newJob.id
//                 ? {
//                     ...job,
//                     status: "completed",
//                     progress: 100,
//                     result,
//                     endTime: new Date(),
//                   }
//                 : job
//             )
//           );
//         }
//       }

//       // Simulate progress for queued jobs
//       if (service.isQueued && !service.supportsStreaming) {
//         const progressInterval = setInterval(() => {
//           setProcessingJobs((prev) =>
//             prev.map((job) => {
//               if (
//                 job.id === newJob.id &&
//                 job.status === "processing" &&
//                 job.progress < 90
//               ) {
//                 return {
//                   ...job,
//                   progress: Math.min(job.progress + Math.random() * 15, 90),
//                 };
//               }
//               return job;
//             })
//           );
//         }, 1000);

//         // Clean up interval after job completion
//         setTimeout(() => {
//           clearInterval(progressInterval);
//         }, 30000);
//       }
//     } catch (error) {
//       console.error(`❌ API call failed for ${serviceId}:`, error);
//       setProcessingJobs((prev) =>
//         prev.map((job) =>
//           job.id === newJob.id
//             ? {
//                 ...job,
//                 status: "failed",
//                 error: error instanceof Error ? error.message : "Unknown error",
//                 endTime: new Date(),
//               }
//             : job
//         )
//       );
//     }
//   };

//   // Preset management
//   const handleSavePreset = (serviceId: string, preset: any) => {
//     setSavedPresets((prev) => ({
//       ...prev,
//       [serviceId]: [...(prev[serviceId] || []), preset],
//     }));
//   };

//   const handleDeletePreset = (serviceId: string, presetId: string) => {
//     setSavedPresets((prev) => ({
//       ...prev,
//       [serviceId]: (prev[serviceId] || []).filter((p) => p.id !== presetId),
//     }));
//   };

//   const handleSetDefaultPreset = (serviceId: string, preset: any) => {
//     setDefaultPresets((prev) => ({
//       ...prev,
//       [serviceId]: preset,
//     }));
//   };

//   const deleteJob = (jobId: string) => {
//     setProcessingJobs((prev) => prev.filter((job) => job.id !== jobId));
//   };

//   const retryJob = (jobId: string) => {
//     const job = processingJobs.find((j) => j.id === jobId);
//     if (job) {
//       processService(job.serviceId, job.config);
//       deleteJob(jobId);
//     }
//   };

//   // Initialize SSE connection
//   useEffect(() => {
//     mountedRef.current = true;
//     initializeSSE();

//     return () => {
//       mountedRef.current = false;
//       if (eventSourceRef.current) {
//         eventSourceRef.current.close();
//       }

//       // Close all streaming connections
//       Object.values(streamingConnectionsRef.current).forEach((connection) => {
//         connection.close();
//       });
//     };
//   }, [initializeSSE]);

//   // If in configuration mode, show the config page
//   if (currentConfigService) {
//     return (
//       <ServiceConfigPage
//         service={currentConfigService}
//         selectedTestimonials={selectedTestimonials}
//         onBack={() => setCurrentConfigService(null)}
//         onProcess={processService}
//         savedPresets={savedPresets[currentConfigService.id] || []}
//         onSavePreset={handleSavePreset}
//         onDeletePreset={handleDeletePreset}
//         onSetDefaultPreset={handleSetDefaultPreset}
//         defaultPreset={defaultPresets[currentConfigService.id]}
//       />
//     );
//   }

//   return (
//     <div className="min-h-screen">
//       {/* Header */}
//       <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center gap-4">
//               <div>
//                 <p className="text-sm text-gray-600">
//                   Transform testimonials with AI
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-4">
//               {selectedTestimonials.length > 0 && (
//                 <div className="hidden sm:flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
//                   {selectedTestimonials.length} selected
//                 </div>
//               )}
//               {processingJobs.filter(
//                 (j) => j.status === "processing" || j.status === "streaming"
//               ).length > 0 && (
//                 <div className="hidden sm:flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
//                   {
//                     processingJobs.filter(
//                       (j) =>
//                         j.status === "processing" || j.status === "streaming"
//                     ).length
//                   }{" "}
//                   processing
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
//         {/* Navigation Tabs */}
//         <div className="flex flex-wrap gap-3 mb-8">
//           <button
//             onClick={() => setActiveTab("services")}
//             className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
//               activeTab === "services"
//                 ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-4 ring-blue-100"
//                 : "text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm border border-gray-200/60"
//             }`}
//           >
//             <Workflow className="w-4 h-4" />
//             <span>AI Services</span>
//           </button>

//           <button
//             onClick={() => setActiveTab("processing")}
//             className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
//               activeTab === "processing"
//                 ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-4 ring-blue-100"
//                 : "text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm border border-gray-200/60"
//             }`}
//           >
//             <Target className="w-4 h-4" />
//             <span>Processing Monitor</span>
//             {processingJobs.filter(
//               (j) => j.status === "processing" || j.status === "streaming"
//             ).length > 0 && (
//               <span className="px-2 py-0.5 text-xs bg-black/10 rounded-full">
//                 {
//                   processingJobs.filter(
//                     (j) => j.status === "processing" || j.status === "streaming"
//                   ).length
//                 }
//               </span>
//             )}
//           </button>
//         </div>

//         {activeTab === "services" && (
//           <Services
//             defaultPresets={defaultPresets}
//             handleCustomizeProcess={handleCustomizeProcess}
//             handleProcessImmediate={handleProcessImmediate}
//             selectedCategory={selectedCategory}
//             selectedTestimonials={selectedTestimonials}
//             setSelectedCategory={setSelectedCategory}
//           />
//         )}

//         {activeTab === "processing" && (
//           <div className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">
//                 Processing Monitor
//               </h2>
//               <p className="text-gray-600 mt-1">
//                 Track your AI processing jobs and download results
//               </p>
//             </div>

//             {processingJobs.length === 0 ? (
//               <div className="bg-white rounded-lg border shadow-sm">
//                 <div className="text-center py-12">
//                   <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">
//                     No processing jobs
//                   </h3>
//                   <p className="text-gray-600">
//                     Start processing to see your jobs here
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {processingJobs.map((job) => {
//                   const service = AI_SERVICES.find(
//                     (s) => s.id === job.serviceId
//                   );
//                   const hasStreamingResult = streamingResults[job.serviceId];

//                   return (
//                     <div
//                       key={job.id}
//                       className="bg-white rounded-lg border shadow-sm"
//                     >
//                       <div className="p-6">
//                         <div className="flex items-center justify-between mb-4">
//                           <div className="flex items-center gap-3">
//                             <div
//                               className={`w-3 h-3 rounded-full ${
//                                 job.status === "completed"
//                                   ? "bg-green-500"
//                                   : job.status === "processing" ||
//                                       job.status === "streaming"
//                                     ? "bg-blue-500 animate-pulse"
//                                     : job.status === "queued"
//                                       ? "bg-yellow-500"
//                                       : job.status === "failed"
//                                         ? "bg-red-500"
//                                         : "bg-gray-400"
//                               }`}
//                             />
//                             <div>
//                               <h3 className="font-semibold text-gray-900">
//                                 {service?.title}
//                                 {job.testimonialIds &&
//                                   ` - ${job.testimonialIds.length} testimonials`}
//                               </h3>
//                               <p className="text-sm text-gray-600">
//                                 Started {job.startTime.toLocaleTimeString()}
//                                 {job.status === "streaming" && (
//                                   <span className="ml-2 text-orange-600">
//                                     • Streaming
//                                   </span>
//                                 )}
//                               </p>
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-2">
//                             <div
//                               className={`px-3 py-1 text-xs font-medium rounded-full ${
//                                 job.status === "completed"
//                                   ? "bg-green-100 text-green-800"
//                                   : job.status === "processing" ||
//                                       job.status === "streaming"
//                                     ? "bg-blue-100 text-blue-800"
//                                     : job.status === "queued"
//                                       ? "bg-yellow-100 text-yellow-800"
//                                       : job.status === "failed"
//                                         ? "bg-red-100 text-red-800"
//                                         : "bg-gray-100 text-gray-800"
//                               }`}
//                             >
//                               {job.status}
//                             </div>

//                             <button
//                               onClick={() => deleteJob(job.id)}
//                               className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </div>

//                         {(job.status === "processing" ||
//                           job.status === "streaming") && (
//                           <div className="space-y-2 mb-4">
//                             <div className="w-full bg-gray-200 rounded-full h-2">
//                               <div
//                                 className="bg-blue-600 h-2 rounded-full transition-all duration-500"
//                                 style={{ width: `${job.progress}%` }}
//                               />
//                             </div>
//                             <div className="flex justify-between text-sm text-gray-600">
//                               <span>{Math.round(job.progress)}% complete</span>
//                               <span>
//                                 Est.{" "}
//                                 {Math.max(
//                                   1,
//                                   Math.round((100 - job.progress) / 20)
//                                 )}{" "}
//                                 min remaining
//                               </span>
//                             </div>
//                           </div>
//                         )}

//                         {/* Streaming Results Display */}
//                         {hasStreamingResult && (
//                           <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
//                             <div className="flex items-center justify-between mb-2">
//                               <h4 className="font-medium text-green-800">
//                                 {hasStreamingResult.isStreaming
//                                   ? "Streaming Results..."
//                                   : "Results"}
//                               </h4>
//                               {hasStreamingResult.isStreaming && (
//                                 <div className="flex items-center space-x-1">
//                                   <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" />
//                                   <div
//                                     className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
//                                     style={{ animationDelay: "0.1s" }}
//                                   />
//                                   <div
//                                     className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
//                                     style={{ animationDelay: "0.2s" }}
//                                   />
//                                 </div>
//                               )}
//                             </div>
//                             <div className="max-h-64 overflow-y-auto">
//                               {hasStreamingResult.type === "markdown" ? (
//                                 <MarkdownRenderer
//                                   content={hasStreamingResult.content}
//                                   isStreaming={hasStreamingResult.isStreaming}
//                                 />
//                               ) : (
//                                 <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
//                                   {hasStreamingResult.content}
//                                   {hasStreamingResult.isStreaming && (
//                                     <span className="inline-flex items-center ml-1">
//                                       <div className="w-2 h-4 bg-blue-500 animate-pulse rounded-sm" />
//                                     </span>
//                                   )}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         )}

//                         {/* Job Results Display */}
//                         {job.status === "completed" &&
//                           job.result &&
//                           !hasStreamingResult && (
//                             <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
//                               <h4 className="font-medium text-green-800 mb-2">
//                                 Results
//                               </h4>
//                               <div className="max-h-64 overflow-y-auto">
//                                 <pre className="text-sm text-gray-800 whitespace-pre-wrap">
//                                   {typeof job.result === "string"
//                                     ? job.result
//                                     : JSON.stringify(job.result, null, 2)}
//                                 </pre>
//                               </div>
//                             </div>
//                           )}

//                         {job.status === "failed" && (
//                           <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
//                             <div className="flex items-start space-x-3">
//                               <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
//                               <div className="flex-1">
//                                 <div className="text-sm font-semibold text-red-800 mb-1">
//                                   Processing Failed
//                                 </div>
//                                 <div className="text-sm text-red-600">
//                                   {job.error}
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {(job.status === "completed" ||
//                           job.status === "failed") && (
//                           <div className="flex gap-3 flex-wrap">
//                             {job.status === "completed" && (
//                               <>
//                                 <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                                   <Download className="h-4 w-4" />
//                                   Download
//                                 </button>
//                                 <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                                   <Eye className="h-4 w-4" />
//                                   Preview
//                                 </button>
//                                 <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                                   <Share2 className="h-4 w-4" />
//                                   Share
//                                 </button>
//                               </>
//                             )}
//                             <button
//                               onClick={() => retryJob(job.id)}
//                               className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                             >
//                               <RotateCcw className="h-4 w-4" />
//                               Retry
//                             </button>
//                           </div>
//                         )}

//                         {job.status === "queued" && (
//                           <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg flex items-center gap-2">
//                             <Clock className="h-4 w-4" />
//                             Waiting in queue...
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <AnimatePresence>
//         {toast && (
//           <Toast
//             message={toast.message}
//             action={toast.action}
//             onAction={toast.onAction}
//             onClose={toast.onClose}
//           />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default AIStudio;

// components/ai-studio/EnhancedAIStudio.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Monitor,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessingJob, StreamingResult } from "./types";
import { AI_SERVICES } from "./definitions";
import ServiceConfigPage from "./service-config";
import MarkdownRenderer from "./MarkdownRenderer";
import Toast from "./Toast";
import AIStudioTestimonialSelector from "./TestimonialSelector";
import { TestimonialStateManager } from "@/utils/TestimonialStateManager";
import { sseServiceManager } from "@/services/SSEServiceManager";
import Services from "./Services";

const CorrectedAIStudio: React.FC = observer(() => {
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(
    []
  );
  const [activeView, setActiveView] = useState<"services" | "monitor">(
    "services"
  );
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [streamingResults, setStreamingResults] = useState<
    Record<string, StreamingResult>
  >({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [toast, setToast] = useState<any>(null);
  const [currentConfigService, setCurrentConfigService] = useState<any>(null);
  const [savedPresets, setSavedPresets] = useState<Record<string, any[]>>({});
  const [defaultPresets, setDefaultPresets] = useState<Record<string, any>>({});

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Load selected testimonials from URL/localStorage
    const saved = TestimonialStateManager.loadSelectedTestimonials();
    setSelectedTestimonials(saved);

    // Initialize SSE connections
    initializeSSEConnections();

    return () => {
      mountedRef.current = false;
      sseServiceManager.cleanup();
    };
  }, []);

  const initializeSSEConnections = useCallback(async () => {
    setConnectionStatus("connecting");

    try {
      sseServiceManager.on("connection", (data) => {
        setConnectionStatus(
          data.status === "connected" ? "connected" : "error"
        );
      });

      sseServiceManager.on("job_status_update", handleJobStatusUpdate);
      sseServiceManager.on("job_completed", handleJobCompletion);
      sseServiceManager.on("job_failed", handleJobFailure);
      sseServiceManager.on("streaming_data", handleStreamingData);

      await sseServiceManager.initializeJobStatusSSE();
    } catch (error) {
      console.error("Failed to initialize SSE:", error);
      setConnectionStatus("error");
    }
  }, []);

  const handleJobStatusUpdate = useCallback((data: any) => {
    if (!mountedRef.current) return;
    setProcessingJobs((prev) =>
      prev.map((job) =>
        job.serviceId === data.service_id
          ? { ...job, ...data, status: data.status }
          : job
      )
    );
  }, []);

  const handleJobCompletion = useCallback((data: any) => {
    if (!mountedRef.current) return;
    setProcessingJobs((prev) =>
      prev.map((job) =>
        job.serviceId === data.service_id
          ? {
              ...job,
              status: "completed",
              progress: 100,
              result: data.result || data,
              endTime: new Date(),
            }
          : job
      )
    );
    showToast({
      message: `${data.service_name || "Service"} completed successfully!`,
      type: "success",
    });
  }, []);

  const handleJobFailure = useCallback((data: any) => {
    if (!mountedRef.current) return;
    setProcessingJobs((prev) =>
      prev.map((job) =>
        job.serviceId === data.service_id
          ? {
              ...job,
              status: "failed",
              error: data.error || "Job failed",
              endTime: new Date(),
            }
          : job
      )
    );
    showToast({
      message: `${data.service_name || "Service"} failed: ${data.error || "Unknown error"}`,
      type: "error",
    });
  }, []);

  const handleStreamingData = useCallback(({ serviceId, chunk }: any) => {
    if (!mountedRef.current) return;
    setStreamingResults((prev) => ({
      ...prev,
      [serviceId]: {
        content: (prev[serviceId]?.content || "") + chunk.content,
        isComplete: false,
        isStreaming: true,
        type: chunk.content_type || "text",
      },
    }));
  }, []);

  const showToast = useCallback((options: any) => {
    setToast(options);
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleTestimonialSelectionChange = useCallback(
    (testimonialIds: string[]) => {
      setSelectedTestimonials(testimonialIds);
      TestimonialStateManager.saveSelectedTestimonials(testimonialIds);
    },
    []
  );

  const processService = useCallback(
    async (serviceId: string, config: any) => {
      if (selectedTestimonials.length === 0) {
        showToast({
          message: "Please select at least one testimonial to process",
          type: "error",
        });
        return;
      }

      const service = AI_SERVICES.find((s) => s.id === serviceId);
      if (!service) {
        showToast({ message: "Service not found", type: "error" });
        return;
      }

      const jobId = `${serviceId}_${Date.now()}`;
      const newJob: ProcessingJob = {
        id: jobId,
        serviceId,
        serviceName: service.title,
        status: "queued",
        progress: 0,
        startTime: new Date(),
        testimonials: selectedTestimonials,
        config,
      };

      setProcessingJobs((prev) => [...prev, newJob]);
      showToast({
        message: `${service.title} processing started`,
        type: "success",
      });
    },
    [selectedTestimonials, showToast]
  );

  // Handle processing
  const handleProcessImmediate = (serviceId: string) => {
    const service = AI_SERVICES.find((s) => s.id === serviceId);
    const config =
      defaultPresets[serviceId]?.config || service?.defaultSettings;
    processService(serviceId, config);
  };

  const handleCustomizeProcess = (serviceId: string) => {
    const service = AI_SERVICES.find((s) => s.id === serviceId);
    setCurrentConfigService(service);
  };

  const handleSavePreset = (serviceId: string, preset: any) => {
    setSavedPresets((prev) => ({
      ...prev,
      [serviceId]: [...(prev[serviceId] || []), preset],
    }));
  };

  const handleDeletePreset = (serviceId: string, presetId: string) => {
    setSavedPresets((prev) => ({
      ...prev,
      [serviceId]: (prev[serviceId] || []).filter((p) => p.id !== presetId),
    }));
  };

  const handleSetDefaultPreset = (serviceId: string, preset: any) => {
    setDefaultPresets((prev) => ({
      ...prev,
      [serviceId]: preset,
    }));
  };

  // If in configuration mode, show the config page (keeping this exactly as original)
  if (currentConfigService) {
    return (
      <ServiceConfigPage
        service={currentConfigService}
        selectedTestimonials={selectedTestimonials}
        onBack={() => setCurrentConfigService(null)}
        onProcess={processService}
        savedPresets={savedPresets[currentConfigService.id] || []}
        defaultPreset={defaultPresets[currentConfigService.id]}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onSetDefaultPreset={handleSetDefaultPreset}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Updated Top Bar - Simple and Professional */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left Side - Simple Title */}
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-medium text-gray-900">AI Studio</h1>
              {connectionStatus !== "connected" && (
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connecting"
                        ? "bg-amber-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-xs text-gray-500 capitalize">
                    {connectionStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Right Side - Simple Toggle */}
            <div className="flex items-center space-x-4">
              {connectionStatus === "error" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sseServiceManager.reconnect()}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reconnect
                </Button>
              )}

              <div className="flex border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setActiveView("services")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeView === "services"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  AI Services
                </button>
                <button
                  onClick={() => setActiveView("monitor")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                    activeView === "monitor"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Monitor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeView === "services" ? (
          <div className="space-y-8">
            {/* Testimonial Selection */}
            <AIStudioTestimonialSelector
              selectedTestimonials={selectedTestimonials}
              onSelectionChange={handleTestimonialSelectionChange}
              isCompact={selectedTestimonials.length > 0}
            />

            {/* Services Section */}
            {selectedTestimonials.length > 0 ? (
              <Services
                defaultPresets={defaultPresets}
                handleCustomizeProcess={handleCustomizeProcess}
                handleProcessImmediate={handleProcessImmediate}
                selectedCategory={selectedCategory}
                selectedTestimonials={selectedTestimonials}
                setSelectedCategory={setSelectedCategory}
              />
            ) : (
              // <div className="space-y-8">
              //   {/* Hero Section (keeping original) */}
              //   <motion.div
              //     initial={{ opacity: 0, y: 20 }}
              //     animate={{ opacity: 1, y: 0 }}
              //     className="text-center max-w-3xl mx-auto"
              //   >
              //     <h2 className="text-4xl font-bold text-gray-900 mb-4">
              //       AI-Powered Testimonial Studio
              //     </h2>
              //     <p className="text-xl text-gray-600 mb-8">
              //       Transform your customer testimonials into professional
              //       marketing content with our comprehensive suite of AI
              //       services.
              //     </p>
              //   </motion.div>

              //   {/* Updated Category Tabs - Professional Style */}
              //   <div className="border-b border-gray-200">
              //     <nav className="flex space-x-8 overflow-x-auto">
              //       {categories.map((category) => (
              //         <button
              //           key={category.id}
              //           onClick={() => setSelectedCategory(category.id)}
              //           className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              //             selectedCategory === category.id
              //               ? "border-purple-600 text-purple-600"
              //               : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              //           }`}
              //         >
              //           <span>{category.label}</span>
              //           <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              //             {category.count}
              //           </span>
              //         </button>
              //       ))}
              //     </nav>
              //   </div>

              //   {/* Original Services Grid (keeping this exactly as it was) */}
              //   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              //     <AnimatePresence>
              //       {filteredServices.map((service, index) => {
              //         const IconComponent = service.icon;

              //         return (
              //           <motion.div
              //             key={service.id}
              //             layout
              //             initial={{ opacity: 0, y: 20 }}
              //             animate={{ opacity: 1, y: 0 }}
              //             exit={{ opacity: 0, scale: 0.95 }}
              //             transition={{ delay: index * 0.1 }}
              //             className="group"
              //           >
              //             <Card
              //               className={`h-full cursor-pointer transition-all duration-300 transform hover:scale-105 border-0 shadow-lg hover:shadow-2xl bg-white/90 backdrop-blur-sm`}
              //             >
              //               <CardHeader className="pb-4">
              //                 <div className="flex items-start justify-between mb-3">
              //                   <div
              //                     className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg`}
              //                   >
              //                     <IconComponent className="h-6 w-6 text-white" />
              //                   </div>
              //                   <div className="flex items-center gap-1">
              //                     {service.isQueued ? (
              //                       <Badge className="bg-green-100 text-green-700 border-green-200">
              //                         Ready
              //                       </Badge>
              //                     ) : (
              //                       <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              //                         Coming Soon
              //                       </Badge>
              //                     )}
              //                   </div>
              //                 </div>

              //                 <div className="space-y-2">
              //                   <CardTitle className="text-lg font-bold text-gray-900">
              //                     {service.title}
              //                   </CardTitle>
              //                   <div className="flex items-center gap-2">
              //                     <Badge
              //                       variant="secondary"
              //                       className="text-xs"
              //                     >
              //                       {service.estimatedTime}
              //                     </Badge>
              //                     <Badge
              //                       variant="outline"
              //                       className="text-xs capitalize"
              //                     >
              //                       {service.category}
              //                     </Badge>
              //                   </div>
              //                 </div>
              //               </CardHeader>

              //               <CardContent className="pt-0 space-y-4">
              //                 <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              //                   {service.description}
              //                 </p>

              //                 <div className="space-y-3">
              //                   <div className="flex flex-wrap gap-1">
              //                     {service.features
              //                       ?.slice(0, 4)
              //                       .map((feature: string) => (
              //                         <Badge
              //                           key={feature}
              //                           variant="secondary"
              //                           className="text-xs bg-gray-100 text-gray-700"
              //                         >
              //                           {feature}
              //                         </Badge>
              //                       ))}
              //                   </div>

              //                   <div className="flex gap-2 pt-2">
              //                     <Button
              //                       variant={
              //                         service.isQueued ? "default" : "outline"
              //                       }
              //                       size="sm"
              //                       className={`flex-1 ${service.isQueued ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" : "hover:bg-gray-50"}`}
              //                       onClick={() =>
              //                         processService(
              //                           service.id,
              //                           service.defaultSettings
              //                         )
              //                       }
              //                       disabled={!service.isQueued}
              //                     >
              //                       {service.isQueued ? (
              //                         <>
              //                           <Play className="h-4 w-4 mr-2" />
              //                           Process
              //                         </>
              //                       ) : (
              //                         <>
              //                           <Clock className="h-4 w-4 mr-2" />
              //                           Coming Soon
              //                         </>
              //                       )}
              //                     </Button>
              //                     <Button
              //                       variant="outline"
              //                       size="sm"
              //                       onClick={() =>
              //                         setCurrentConfigService(service)
              //                       }
              //                       disabled={!service.isQueued}
              //                     >
              //                       <Settings className="h-4 w-4" />
              //                     </Button>
              //                   </div>
              //                 </div>
              //               </CardContent>
              //             </Card>
              //           </motion.div>
              //         );
              //       })}
              //     </AnimatePresence>
              //   </div>
              // </div>
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cpu className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select Testimonials to Begin
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Choose one or more testimonials above to unlock AI services
                  and start processing your content.
                </p>
              </div>
            )}
          </div>
        ) : (
          <JobMonitor
            jobs={processingJobs}
            streamingResults={streamingResults}
          />
        )}
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

// Simple Job Monitor Component (keeping original structure)
interface JobMonitorProps {
  jobs: ProcessingJob[];
  streamingResults: Record<string, StreamingResult>;
}

const JobMonitor: React.FC<JobMonitorProps> = ({ jobs, streamingResults }) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Monitor className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Processing Monitor
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Your processing jobs will appear here. Start processing testimonials
          to see real-time progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Processing Monitor
      </h2>

      <div className="grid gap-6">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {job.status === "processing" && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {job.status === "completed" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {job.status === "failed" && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  {job.status === "queued" && (
                    <Clock className="w-4 h-4 text-yellow-600" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{job.serviceName}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {job.testimonials?.length} testimonial
                      {job.testimonials?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    job.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : job.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : job.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {streamingResults[job.serviceId] && (
                <div className="space-y-2">
                  <h4 className="font-medium">Live Results:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <MarkdownRenderer
                      content={streamingResults[job.serviceId].content}
                    />
                    {streamingResults[job.serviceId].isStreaming && (
                      <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Streaming...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CorrectedAIStudio;
