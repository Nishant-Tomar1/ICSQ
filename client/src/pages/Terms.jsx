import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";

function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4 ">
      <div className="max-w-4xl mx-auto">
      <div className="pt-6 flex justify-between items-center mb-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="hover:bg-[#93725E] hover:text-white transition-colors duration-200"
              >
                Go Back
              </Button>
              <p className="text-sm text-gray-400">Last updated: January 2024</p>
            </div>
        <Card className="bg-[#2a2a2a]/70 border border-[#93725E]/20">
          <CardHeader>
            <div className="font-bold text-orange-400 w-full text-3xl text-center">Terms and Conditions</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2 text-[goldenrod]">1. Acceptance of Terms</h2>
              <p className="text-gray-300">
                By accessing and using the SOBHA ICSQ System, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 text-[goldenrod]">2. User Responsibilities</h2>
              <p className="text-gray-300">
                Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. Any unauthorized use or security breaches should be reported immediately.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 text-[goldenrod]">3. Data Privacy</h2>
              <p className="text-gray-300">
                We are committed to protecting your privacy. All personal information collected will be used in accordance with our privacy policy and applicable data protection laws.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 text-[goldenrod]">4. Intellectual Property</h2>
              <p className="text-gray-300">
                All content, features, and functionality of the ICSQ System are owned by SOBHA Realty and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 text-[goldenrod]">5. System Usage</h2>
              <p className="text-gray-300">
                The ICSQ System should be used solely for its intended purpose. Any attempt to interfere with the proper working of the system or bypass security measures is strictly prohibited.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 text-[goldenrod]">6. Modifications</h2>
              <p className="text-gray-300">
                SOBHA Realty reserves the right to modify these terms at any time. Continued use of the system after such modifications constitutes acceptance of the updated terms.
              </p>
            </div>

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Terms;
