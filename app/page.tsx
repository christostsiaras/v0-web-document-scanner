"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scan, Download, Trash2, AlertCircle } from "lucide-react"

declare global {
  interface Window {
    Dynamsoft: any
  }
}

export default function DocumentScannerPage() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [scannedImages, setScannedImages] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const licenseKey =
    "DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA0NjY0MDc4LU1UQTBOalkwTURjNExYZGxZaTFVY21saGJGQnliMm8iLCJtYWluU2VydmVyVVJMIjoiaHR0cHM6Ly9tZGxzLmR5bmFtc29mdG9ubGluZS5jb20iLCJvcmdhbml6YXRpb25JRCI6IjEwNDY2NDA3OCIsInN0YW5kYnlTZXJ2ZXJVUkwiOiJodHRwczovL3NkbHMuZHluYW1zb2Z0b25saW5lLmNvbSIsImNoZWNrQ29kZSI6MjA2ODYyNDY1MX0="
  const [isInitialized, setIsInitialized] = useState(false)
  const scannerRef = useRef<any>(null)
  const initializingRef = useRef(false)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.2.0/dist/dds.bundle.js"
    script.async = true
    script.onload = () => {
      setIsScriptLoaded(true)
    }
    script.onerror = () => {
      setError("Failed to load Dynamsoft Document Scanner library")
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (isScriptLoaded && !isInitialized && !initializingRef.current && !scannerRef.current) {
      initializeScanner()
    }
  }, [isScriptLoaded])

  const initializeScanner = async () => {
    if (!isScriptLoaded || initializingRef.current || scannerRef.current) {
      return
    }

    initializingRef.current = true
    setError(null)

    try {
      scannerRef.current = new window.Dynamsoft.DocumentScanner({
        license: licenseKey,
      })
      setIsInitialized(true)

      try {
        if (scannerRef.current.cameraEnhancer) {
          await scannerRef.current.cameraEnhancer.setResolution({ width: 3840, height: 2160 })
          console.log("[v0] Camera resolution set to 4K")
        }
      } catch (resErr) {
        console.log("[v0] Could not set 4K resolution:", resErr)
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize scanner. Please check your license key.")
      scannerRef.current = null
    } finally {
      initializingRef.current = false
    }
  }

  const handleScan = async () => {
    if (!isScriptLoaded) {
      setError("Scanner library is still loading. Please wait.")
      return
    }

    if (!scannerRef.current) {
      setError("Scanner initialization failed. Please reload the page.")
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      const result = await scannerRef.current.launch()

      if (result?.correctedImageResult) {
        const canvas = result.correctedImageResult.toCanvas()
        const imageDataUrl = canvas.toDataURL("image/png")
        setScannedImages((prev) => [...prev, imageDataUrl])
      }
    } catch (err: any) {
      setError(err.message || "Failed to scan document. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `scanned-document-${index + 1}.png`
    link.click()
  }

  const handleDelete = (index: number) => {
    setScannedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setScannedImages([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Document Scanner</h1>
          <p className="text-gray-600 dark:text-gray-300">Scan documents using your device camera</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleScan}
              disabled={isScanning || !isScriptLoaded || !isInitialized}
              className="w-full"
              size="lg"
            >
              <Scan className="mr-2 h-5 w-5" />
              {isScanning ? "Scanning..." : !isScriptLoaded ? "Loading..." : "Start Scanning"}
            </Button>
          </CardContent>
        </Card>

        {scannedImages.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scanned Documents</CardTitle>
                  <CardDescription>
                    {scannedImages.length} document{scannedImages.length !== 1 ? "s" : ""} scanned
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scannedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Scanned document ${index + 1}`}
                      className="w-full h-64 object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(imageUrl, index)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 text-center text-sm text-gray-600 dark:text-gray-300">Document {index + 1}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
