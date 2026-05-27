"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AgGridReact, AgGridProvider } from "ag-grid-react";
import { ColDef, GridReadyEvent, AllCommunityModule, ICellRendererParams } from "ag-grid-community";
import { Candidate, CandidateStatus } from "../../types";
import FilterToolbar from "../../components/filters/filter-toolbar";
import DetailsDrawer from "../../components/candidate/details-drawer";
import { useCandidates, useDeleteCandidate, useUpdateCandidateStatus } from "../../hooks/useCandidates";
import {
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// Custom inline SVG icons to prevent lucide-react brand icon version conflicts
const Linkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Required styles for AG Grid
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const normalizedStatus =
    statusParam === "in_progress" || statusParam === "selected" || statusParam === "rejected"
      ? statusParam
      : "ALL";

  const [filters, setFilters] = useState({
    search: "",
    status: normalizedStatus,
    hasLinkedin: false,
    hasGithub: false,
    location: "",
    skills: "",
    engagementMode: "ALL",
  });

  // Synchronize URL search parameter status updates dynamically
  React.useEffect(() => {
    const statusParam = searchParams.get("status");
    const normalized =
      statusParam === "in_progress" || statusParam === "selected" || statusParam === "rejected"
        ? statusParam
        : "ALL";
    setFilters((prev) => ({
      ...prev,
      status: normalized,
    }));
  }, [searchParams]);

  // Queries & Mutations
  const { data: candidates = [], isLoading } = useCandidates({
    search: filters.search,
    status: filters.status,
    hasLinkedin: filters.hasLinkedin,
    hasGithub: filters.hasGithub,
    location: filters.location,
    skills: filters.skills,
    engagement_mode: filters.engagementMode === "ALL" ? undefined : filters.engagementMode,
  });
  const deleteCandidateMutation = useDeleteCandidate();
  const updateStatusMutation = useUpdateCandidateStatus();

  // Selected state for sliding drawer
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const gridRef = useRef<AgGridReact>(null);

  // Status badge style mapper
  const getStatusClasses = (status: CandidateStatus) => {
    switch (status) {
      case "selected":
        return "bg-green-50 text-green-700 border-green-200 focus:ring-green-100 hover:bg-green-100/50";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200 focus:ring-red-100 hover:bg-red-100/50";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-100 hover:bg-blue-100/50";
    }
  };

  // Custom Name Cell Renderer with initials-avatar
  const NameCellRenderer = useCallback((params: ICellRendererParams<Candidate, string>) => {
    const name = params.value || "";
    const initial = name ? name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "CV";

    return (
      <div className="flex items-center gap-2.5 h-full py-2 cursor-pointer group">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-[10px] shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
          {initial}
        </div>
        <span className="font-semibold text-slate-800 group-hover:text-blue-600 group-hover:underline transition-all duration-150 decoration-2 decoration-blue-200">
          {name}
        </span>
      </div>
    );
  }, []);

  // 1. Custom Status Dropdown Cell Renderer
  const StatusCellRenderer = useCallback((params: ICellRendererParams<Candidate, CandidateStatus>) => {
    if (!params.data) return null;
    const candidateId = params.data.id;
    const currentStatus = params.value || "in_progress";

    return (
      <div className="relative inline-block w-full text-left">
        <select
          value={currentStatus}
          onChange={(e) => {
            updateStatusMutation.mutate({
              id: candidateId,
              status: e.target.value as CandidateStatus,
            });
          }}
          className={`appearance-none w-full border rounded-xl py-1 px-3 pr-8 text-xs font-bold uppercase tracking-wider cursor-pointer outline-none transition-all focus:ring-2 border-slate-100 focus:outline-none ${getStatusClasses(
            currentStatus
          )}`}
        >
          <option value="in_progress">In Progress</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>
    );
  }, [updateStatusMutation]);

  // 2. Custom Social Icons Cell Renderer
  const SocialCellRenderer = useCallback((params: ICellRendererParams<Candidate, string>) => {
    if (!params.data) return null;
    const { linkedin_url, github_url } = params.data;
    const isLinkedIn = params.colDef?.field === "linkedin_url";
    const url = isLinkedIn ? linkedin_url : github_url;

    if (!url) {
      return <span className="text-slate-300 font-medium text-xs">N/A</span>;
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all shadow-sm ${
          isLinkedIn ? "text-blue-600 hover:border-blue-200" : "text-slate-700 hover:border-slate-300"
        }`}
      >
        {isLinkedIn ? <Linkedin className="h-3.5 w-3.5" /> : <Github className="h-3.5 w-3.5" />}
      </a>
    );
  }, []);

  // 3. Custom Action Buttons Cell Renderer
  const ActionsCellRenderer = useCallback((params: ICellRendererParams<Candidate, string>) => {
    if (!params.data) return null;
    const candidateId = params.data.id;
    const candidateName = params.data.name;

    return (
      <div className="flex items-center gap-1.5 justify-end w-full">
        <button
          onClick={() => {
            setSelectedCandidateId(candidateId);
            setIsDrawerOpen(true);
          }}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors border border-slate-50 cursor-pointer"
          title="View Details"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            setSelectedCandidateId(candidateId);
            setIsDrawerOpen(true);
          }}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors border border-slate-50 cursor-pointer"
          title="Edit Details"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={async () => {
            if (confirm(`Are you sure you want to delete ${candidateName}?`)) {
              await deleteCandidateMutation.mutateAsync(candidateId);
            }
          }}
          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors border border-slate-50 cursor-pointer"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }, [deleteCandidateMutation]);

  // Define table columns
  const columnDefs = useMemo<ColDef<Candidate>[]>(
    () => [
      {
        field: "name",
        headerName: "Candidate Name",
        sortable: true,
        filter: true,
        checkboxSelection: false,
        headerCheckboxSelection: false,
        flex: 1.5,
        minWidth: 160,
        cellRenderer: NameCellRenderer,
      },
      {
        field: "email",
        headerName: "Email Address",
        sortable: true,
        filter: true,
        flex: 1.5,
        minWidth: 180,
      },
      {
        field: "phone",
        headerName: "Phone Number",
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 130,
      },
      {
        field: "linkedin_url",
        headerName: "LinkedIn",
        flex: 0.6,
        minWidth: 80,
        cellRenderer: SocialCellRenderer,
        filter: false,
        sortable: false,
      },
      {
        field: "github_url",
        headerName: "GitHub",
        flex: 0.6,
        minWidth: 80,
        cellRenderer: SocialCellRenderer,
        filter: false,
        sortable: false,
      },
      {
        field: "status",
        headerName: "Recruitment Status",
        sortable: true,
        filter: true,
        flex: 1.2,
        minWidth: 140,
        cellRenderer: StatusCellRenderer,
      },
      {
        field: "created_at",
        headerName: "Uploaded Date",
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return new Date(params.value).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        },
      },
      {
        headerName: "Actions",
        cellRenderer: ActionsCellRenderer,
        sortable: false,
        filter: false,
        flex: 1,
        minWidth: 130,
      },
    ],
    [ActionsCellRenderer, NameCellRenderer, SocialCellRenderer, StatusCellRenderer]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      filterParams: {
        buttons: ["reset", "apply"],
      },
    }),
    []
  );

  // Resize columns to fit size
  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top action layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recruiting Pipeline</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Excel-style screening board powered by AG Grid with real-time status management.
          </p>
        </div>
      </div>

      {/* Filter Toolbar Section */}
      <FilterToolbar
        onFiltersChange={setFilters}
        isLoading={isLoading}
        initialStatus={filters.status}
      />

      {/* Primary AG Grid Workspace */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100/50 overflow-hidden p-2">
        <div
          className="ag-theme-alpine ag-theme-custom-trms w-full overflow-hidden"
          style={{ height: "480px" }}
        >
          <AgGridProvider modules={[AllCommunityModule]}>
            <AgGridReact
              ref={gridRef}
              rowData={candidates}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
              onGridReady={onGridReady}
              animateRows={true}
              rowSelection="multiple"
              suppressCellFocus={true}
              rowHeight={56}
              headerHeight={48}
              theme="legacy"
              rowClass="cursor-pointer"
              onRowClicked={(event) => {
                // If they clicked the status dropdown or action button vectors, do not trigger the drawer
                const target = event.event?.target as HTMLElement;
                if (
                  target &&
                  (target.closest("select") ||
                    target.closest("button") ||
                    target.closest("a") ||
                    target.tagName === "SELECT" ||
                    target.tagName === "BUTTON" ||
                    target.tagName === "A")
                ) {
                  return;
                }
                if (event.data?.id) {
                  setSelectedCandidateId(event.data.id);
                  setIsDrawerOpen(true);
                }
              }}
            />
          </AgGridProvider>
        </div>
      </div>

      {/* Footnote helper */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-semibold text-slate-400 shadow-sm leading-relaxed">
        <AlertCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span>
          Recruitment status updates are instantly computed into summary counts. Clicking a candidate status badge opens inline options.
        </span>
      </div>

      {/* Candidate Details Drawer */}
      <DetailsDrawer
        candidateId={selectedCandidateId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCandidateId(null);
        }}
      />

    </div>
  );
}
