import type { CameraSource } from '../../types.js'
import type { CameraTestResult, CaptureOptions } from '../camera-source.js'

export interface CameraAdapter<TSource extends CameraSource = CameraSource> {
  supports(source: CameraSource): source is TSource
  captureJpeg(source: TSource, options: CaptureOptions): Promise<Buffer>
  testConnection?(source: TSource): Promise<CameraTestResult>
}
