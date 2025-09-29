// components/ai-generated-content/ServiceLineageVisualization.tsx
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Video,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Target
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { EnhancedArtifact } from "./ContentCategorization";

interface ServiceLineageVisualizationProps {
  artifacts: EnhancedArtifact[];
  selectedArtifactId?: string;
  onArtifactSelect?: (artifactId: string) => void;
  className?: string;
}

interface LineageNode {
  artifact: EnhancedArtifact;
  children: LineageNode[];
  level: number;
  position: number;
}

const ServiceLineageVisualization: React.FC<ServiceLineageVisualizationProps> = ({
  artifacts,
  selectedArtifactId,
  onArtifactSelect,
  className = ""
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build lineage tree structure
  const lineageTree = useMemo(() => {
    const nodeMap = new Map<string, LineageNode>();
    const rootNodes: LineageNode[] = [];

    // Create nodes for all artifacts
    artifacts.forEach(artifact => {
      nodeMap.set(artifact.id, {
        artifact,
        children: [],
        level: artifact.lineage.level,
        position: 0
      });
    });

    // Build parent-child relationships
    artifacts.forEach(artifact => {
      const node = nodeMap.get(artifact.id)!;

      if (artifact.lineage.parentId && nodeMap.has(artifact.lineage.parentId)) {
        const parentNode = nodeMap.get(artifact.lineage.parentId)!;
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Sort by creation date
    const sortByDate = (a: LineageNode, b: LineageNode) =>
      new Date(b.artifact.created_at).getTime() - new Date(a.artifact.created_at).getTime();

    rootNodes.sort(sortByDate);
    nodeMap.forEach(node => node.children.sort(sortByDate));

    return rootNodes;
  }, [artifacts]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getArtifactIcon = (artifact: EnhancedArtifact) => {
    const category = artifact.category;
    if (category.id.includes('video')) return Video;
    if (category.id.includes('text') || category.id.includes('content')) return FileText;
    return category.icon;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getTotalArtifactsInChain = (node: LineageNode): number => {
    let count = 1; // Count the node itself
    node.children.forEach(child => {
      count += getTotalArtifactsInChain(child);
    });
    return count;
  };

  const LineageNodeComponent: React.FC<{
    node: LineageNode;
    depth: number;
    isLast: boolean;
    parentConnections: boolean[];
  }> = ({ node, depth, isLast, parentConnections }) => {
    const { artifact } = node;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(artifact.id);
    const isSelected = selectedArtifactId === artifact.id;
    const Icon = getArtifactIcon(artifact);

    return (
      <div className="relative">
        {/* Connection lines */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 flex">
            {parentConnections.map((hasConnection, index) => (
              <div key={index} className="w-6 flex justify-center">
                {hasConnection && (
                  <div className="w-px bg-gray-300 h-full" />
                )}
              </div>
            ))}
            <div className="w-6 flex justify-center">
              <div className="w-px bg-gray-300 h-1/2" />
            </div>
          </div>
        )}

        {/* Horizontal connection */}
        {depth > 0 && (
          <div
            className="absolute top-1/2 bg-gray-300 h-px"
            style={{
              left: `${depth * 24 - 12}px`,
              width: '12px'
            }}
          />
        )}

        {/* Node content */}
        <div
          className={`ml-${depth * 4} flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
            isSelected
              ? 'bg-blue-50 border-blue-200'
              : 'hover:bg-gray-50 border-gray-200'
          }`}
          onClick={() => onArtifactSelect?.(artifact.id)}
        >
          {/* Source type indicator */}
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            artifact.lineage.sourceType === 'multi-testimonial' ? 'bg-blue-400' :
            artifact.lineage.sourceType === 'artifact' ? 'bg-purple-400' : 'bg-green-400'
          }`}></div>

          {/* Artifact icon and content */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Expand/collapse for children */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(artifact.id);
                }}
                className="h-5 w-5 p-0 hover:bg-gray-200 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : (
              <div className="w-5" />
            )}

            {/* Content type icon */}
            <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon className="h-3.5 w-3.5 text-gray-600" />
            </div>

            {/* Artifact details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {artifact.processing_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                {artifact.platformTarget && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    <Target className="h-2.5 w-2.5 mr-0.5" />
                    {artifact.platformTarget.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {formatRelativeTime(artifact.created_at)}
                </span>
                {artifact.sourceTestimonials.length > 0 && (
                  <span className="flex items-center">
                    <User className="h-2.5 w-2.5 mr-1" />
                    {artifact.sourceTestimonials.length} source{artifact.sourceTestimonials.length !== 1 ? 's' : ''}
                  </span>
                )}
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  Level {artifact.lineage.level}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {node.children.map((childNode, index) => (
                <LineageNodeComponent
                  key={childNode.artifact.id}
                  node={childNode}
                  depth={depth + 1}
                  isLast={index === node.children.length - 1}
                  parentConnections={[...parentConnections, !isLast]}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };


  if (artifacts.length === 0) {
    return (
      <Card className={`border border-gray-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No Processing Lineage</h3>
          <p className="text-xs text-gray-500">
            No AI-generated content found to visualize.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with explanation */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Content Processing Lineage</h3>
                <p className="text-xs text-gray-500">
                  Shows how content was created and processed from source testimonials
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {artifacts.length} items
            </Badge>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>Source Content</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Multi-Source</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span>Derived</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <ChevronRight className="h-3 w-3" />
              <span>Click to expand/collapse</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Chains */}
      <div className="space-y-3">
        {lineageTree.map((rootNode, index) => (
          <Card key={rootNode.artifact.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    rootNode.artifact.lineage.sourceType === 'multi-testimonial' ? 'bg-blue-400' :
                    rootNode.artifact.lineage.sourceType === 'artifact' ? 'bg-purple-400' : 'bg-green-400'
                  }`}></div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Processing Chain {index + 1}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {getTotalArtifactsInChain(rootNode)} items •
                      Started {formatRelativeTime(rootNode.artifact.created_at)}
                    </p>
                  </div>
                </div>
                {getTotalArtifactsInChain(rootNode) > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleNode(rootNode.artifact.id)}
                    className="text-xs h-6 px-2"
                  >
                    {expandedNodes.has(rootNode.artifact.id) ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3 mr-1" />
                        Expand
                      </>
                    )}
                  </Button>
                )}
              </div>

              <LineageNodeComponent
                node={rootNode}
                depth={0}
                isLast={true}
                parentConnections={[]}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceLineageVisualization;