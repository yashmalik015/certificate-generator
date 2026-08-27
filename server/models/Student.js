import mongoose from 'mongoose';

const generatedCertSchema = new mongoose.Schema({
  templateId: { type: String, required: true },
  pngUrl: { type: String, required: true },
  pdfUrl: { type: String, required: true }
}, { _id: false });

const studentSchema = new mongoose.Schema(
  {
    refno: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    fathersHusbandName: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    dateOfBirth: { type: Date },
    letterIssuedAt: { type: Date, required: true, default: Date.now },
    certificateNumber: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    nationality: { type: String, required: true, default: 'Indian' },
    eventId: { type: mongoose.Schema.Types.Mixed, ref: 'Event', required: true },
    subjectId: { type: mongoose.Schema.Types.Mixed, ref: 'Subject', required: true },
    certificateTemplateIds: [{ type: String, required: true }],
    photoUrl: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    mailSent: { type: Boolean, default: false },
    generatedCertificateUrls: [generatedCertSchema]
  },
  { timestamps: true }
);

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
