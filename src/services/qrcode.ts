import * as QRCode from 'qrcode';

export interface QRCodeData {
  spotId: string;
  spotNumber: string;
  timestamp: number;
  checkInCode: string;
}

export class QRCodeService {
  /**
   * Generate QR code for a parking spot
   */
  static async generateSpotQRCode(spotId: string, spotNumber: string): Promise<string> {
    const qrData: QRCodeData = {
      spotId,
      spotNumber,
      timestamp: Date.now(),
      checkInCode: this.generateCheckInCode(spotId)
    };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate unique check-in code for spot
   */
  private static generateCheckInCode(spotId: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `${spotId}-${timestamp.slice(-6)}-${random}`.toUpperCase();
  }

  /**
   * Scan QR code using device camera (placeholder for now)
   * In a real implementation, you would use @capacitor-community/barcode-scanner
   * or integrate with the device's camera API
   */
  static async scanQRCode(): Promise<QRCodeData | null> {
    try {
      // For now, return a mock QR code data
      // In production, this would use the device camera
      console.log('QR Scanner would open here');
      
      // Mock data for testing
      const mockQRData: QRCodeData = {
        spotId: 'A01',
        spotNumber: 'A-01',
        timestamp: Date.now(),
        checkInCode: this.generateCheckInCode('A01')
      };
      
      return mockQRData;
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw error;
    }
  }

  /**
   * Parse QR code data
   */
  static parseQRCodeData(content: string): QRCodeData | null {
    try {
      const data = JSON.parse(content) as QRCodeData;
      
      // Validate QR code structure
      if (!data.spotId || !data.spotNumber || !data.timestamp || !data.checkInCode) {
        throw new Error('Invalid QR code format');
      }

      // Check if QR code is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - data.timestamp > maxAge) {
        throw new Error('QR code has expired');
      }

      return data;
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  }

  /**
   * Stop QR code scanning (placeholder)
   */
  static async stopScan(): Promise<void> {
    try {
      console.log('QR Scanner stopped');
    } catch (error) {
      console.error('Error stopping QR scan:', error);
    }
  }

  /**
   * Validate check-in code
   */
  static validateCheckInCode(code: string, spotId: string): boolean {
    const parts = code.split('-');
    if (parts.length !== 3) return false;
    
    return parts[0] === spotId;
  }

  /**
   * Generate QR code for reservation confirmation
   */
  static async generateReservationQRCode(reservationId: string, spotId: string): Promise<string> {
    const qrData = {
      type: 'reservation',
      reservationId,
      spotId,
      timestamp: Date.now()
    };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 1,
        color: {
          dark: '#3880ff',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating reservation QR code:', error);
      throw new Error('Failed to generate reservation QR code');
    }
  }

  /**
   * Simulate QR code scanning with manual input (for development)
   */
  static async simulateQRScan(qrData: QRCodeData): Promise<QRCodeData> {
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return qrData;
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateQRCodeSVG(data: string): Promise<string> {
    try {
      return await QRCode.toString(data, {
        type: 'svg',
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }
}