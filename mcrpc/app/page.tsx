"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Trash2, Package, Pickaxe, Zap } from "lucide-react"

// Mock Uppy integration - in a real app you'd import from '@uppy/core' etc.
interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
}

export default function MinecraftResourcePackCombiner() {
  const [uploadedPacks, setUploadedPacks] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isCombining, setIsCombining] = useState(false)
  const [combineProgress, setCombineProgress] = useState(0)
  const [combinedPack, setCombinedPack] = useState<string | null>(null)

  // Simulate file upload
  const handleFileUpload = () => {
    setIsUploading(true)
    // Simulate upload delay
    setTimeout(() => {
      const newPack: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: `ResourcePack_${uploadedPacks.length + 1}.zip`,
        size: Math.floor(Math.random() * 50000000) + 1000000, // 1-50MB
        type: "application/zip",
      }
      setUploadedPacks((prev) => [...prev, newPack])
      setIsUploading(false)
    }, 1500)
  }

  // Simulate combining packs
  const handleCombinePacks = () => {
    if (uploadedPacks.length < 2) return

    setIsCombining(true)
    setCombineProgress(0)

    const interval = setInterval(() => {
      setCombineProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsCombining(false)
          setCombinedPack("CombinedResourcePack.zip")
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const removePack = (id: string) => {
    setUploadedPacks((prev) => prev.filter((pack) => pack.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 via-green-500 to-green-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-600 border-4 border-amber-800 flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-100" />
            </div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg font-mono">RESOURCE PACK COMBINER</h1>
            <div className="w-12 h-12 bg-amber-600 border-4 border-amber-800 flex items-center justify-center">
              <Pickaxe className="w-6 h-6 text-amber-100" />
            </div>
          </div>
          <p className="text-green-100 text-lg font-mono">
            Combine multiple Minecraft resource packs into one powerful pack!
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6 border-4 border-stone-600 bg-stone-200 shadow-lg">
          <CardHeader className="bg-stone-300 border-b-4 border-stone-600">
            <CardTitle className="flex items-center gap-2 font-mono text-stone-800">
              <Upload className="w-5 h-5" />
              Upload Resource Packs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div
              className="border-4 border-dashed border-stone-400 rounded-lg p-8 text-center bg-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
              onClick={handleFileUpload}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-stone-600 font-mono">Uploading resource pack...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-green-500 border-4 border-green-700 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-green-100" />
                  </div>
                  <p className="text-stone-700 font-mono text-lg font-bold">Click to upload .zip resource packs</p>
                  <p className="text-stone-500 font-mono text-sm">Drag and drop files here or click to browse</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Packs */}
        {uploadedPacks.length > 0 && (
          <Card className="mb-6 border-4 border-stone-600 bg-stone-200 shadow-lg">
            <CardHeader className="bg-stone-300 border-b-4 border-stone-600">
              <CardTitle className="flex items-center gap-2 font-mono text-stone-800">
                <Package className="w-5 h-5" />
                Uploaded Resource Packs ({uploadedPacks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {uploadedPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="flex items-center justify-between p-4 bg-stone-100 border-2 border-stone-400 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 border-2 border-amber-700 flex items-center justify-center">
                        <Package className="w-5 h-5 text-amber-100" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-stone-800">{pack.name}</p>
                        <p className="font-mono text-sm text-stone-600">{formatFileSize(pack.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePack(pack.id)}
                      className="bg-red-600 hover:bg-red-700 border-2 border-red-800 font-mono"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Combine Section */}
        {uploadedPacks.length >= 2 && (
          <Card className="mb-6 border-4 border-stone-600 bg-stone-200 shadow-lg">
            <CardHeader className="bg-stone-300 border-b-4 border-stone-600">
              <CardTitle className="flex items-center gap-2 font-mono text-stone-800">
                <Zap className="w-5 h-5" />
                Combine Resource Packs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!isCombining && !combinedPack && (
                <div className="text-center">
                  <p className="font-mono text-stone-700 mb-4">
                    Ready to combine {uploadedPacks.length} resource packs!
                  </p>
                  <Button
                    onClick={handleCombinePacks}
                    className="bg-green-600 hover:bg-green-700 border-4 border-green-800 font-mono text-lg px-8 py-3"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    COMBINE PACKS
                  </Button>
                </div>
              )}

              {isCombining && (
                <div className="text-center space-y-4">
                  <p className="font-mono text-stone-700 text-lg font-bold">Combining resource packs...</p>
                  <Progress value={combineProgress} className="w-full h-4 bg-stone-300" />
                  <p className="font-mono text-stone-600">{combineProgress}% complete</p>
                </div>
              )}

              {combinedPack && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge className="bg-green-600 text-green-100 font-mono text-lg px-4 py-2">
                      ✓ COMBINATION COMPLETE
                    </Badge>
                  </div>
                  <p className="font-mono text-stone-700 mb-4">Your combined resource pack is ready for download!</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 border-4 border-blue-800 font-mono text-lg px-8 py-3">
                    <Download className="w-5 h-5 mr-2" />
                    DOWNLOAD {combinedPack}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-4 border-stone-600 bg-stone-200 shadow-lg">
          <CardHeader className="bg-stone-300 border-b-4 border-stone-600">
            <CardTitle className="font-mono text-stone-800">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 border-4 border-blue-700 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-100 font-mono font-bold text-xl">1</span>
                </div>
                <h3 className="font-mono font-bold text-stone-800 mb-2">Upload Packs</h3>
                <p className="font-mono text-sm text-stone-600">Upload multiple .zip resource pack files</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500 border-4 border-yellow-700 flex items-center justify-center mx-auto mb-3">
                  <span className="text-yellow-100 font-mono font-bold text-xl">2</span>
                </div>
                <h3 className="font-mono font-bold text-stone-800 mb-2">Combine</h3>
                <p className="font-mono text-sm text-stone-600">Our tool merges all packs intelligently</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 border-4 border-green-700 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-100 font-mono font-bold text-xl">3</span>
                </div>
                <h3 className="font-mono font-bold text-stone-800 mb-2">Download</h3>
                <p className="font-mono text-sm text-stone-600">Get your combined resource pack</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
