import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Label from "../components/ui/Label"
import Separator from "../components/ui/Separator"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card"
import logo from "../assets/logo.png"
import teamsLogo from "../assets/microsoft.png"
import bg from "../assets/bg-image.png"
import bgImage from "../assets/bg-image.png";

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [microsoftLoginUrl, setMicrosoftLoginUrl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, currentUser, getMicrosoftLoginUrl } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (currentUser) {
      navigate(location.state?.from?.pathname || "/dashboard")
    }
  }, [currentUser, navigate, location])

  useEffect(() => {
    const fetchMicrosoftLoginUrl = async () => {
      try {
        console.log("Frontend: Attempting to fetch Microsoft login URL...");
        const url = await getMicrosoftLoginUrl()
        console.log("Frontend: Successfully got Microsoft login URL:", url);
        setMicrosoftLoginUrl(url)
      } catch (error) {
        console.error("Frontend: Error fetching Microsoft login URL:", error);
        console.error("Frontend: Error response:", error.response);
        console.error("Frontend: Error status:", error.response?.status);
        console.error("Frontend: Error data:", error.response?.data);
      }
    }

    fetchMicrosoftLoginUrl()
  }, [getMicrosoftLoginUrl])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast({
        title: "Login successful",
        description: "Welcome back to SOBHA ICSQ System",
      })
      navigate(location?.from?.pathname || "/dashboard")
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftLogin = () => {
    if (microsoftLoginUrl) {
      window.location.href = microsoftLoginUrl
    } else {
      toast({
        title: "Error",
        description: "Microsoft login is not available at the moment",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side Content */}
      <div 
        className="lg:w-1/2 text-white flex flex-col justify-center items-start p-12 space-y-4 relative overflow-hidden"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: '80% center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-bold">THE SOBHA WAY</h1>
          <p className="max-w-xl text-lg leading-relaxed mt-4">
          It aligns internal efforts with SOBHA's customer-centric values and ultimately
          contributes to delivering excellence to our Internal and external customers.
          </p>
        </div>
        <div className="absolute -inset-4 bg-black bg-opacity-30"></div>
      </div>

      {/* Right Side Login */}
      <div className="lg:w-1/2 w-full bg-white flex items-center justify-center p-4 relative">
        <div className="w-full max-w-sm">
          <div className="text-center mb-4">
            <img src={logo} alt="SOBHA Logo" width={50} className="mx-auto mb-2" />
            <h1 className="text-xl font-bold text-[#83725E]">ICSQ Survey System</h1>
            <p className="text-xs text-gray-600">Understanding Within, Delight Beyond</p>
          </div>

          <Card className="bg-white shadow-none text-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-950 text-lg">Login</CardTitle>
              <CardDescription className="text-sm">Enter your credentials to access the ICSQ system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 shadow-b-none">
              <Button
                className="w-full flex items-center justify-center gap-2 text-sm"
                variant="outline"
                onClick={handleMicrosoftLogin}
              >
                <img src={teamsLogo} alt="teams Logo" width={20} />
                <span>Microsoft Single Sign-On</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleLogin}>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@sobharealty.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full text-sm" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  <div className="text-[12px] text-gray-400 text-center w-full">By logging here, you agree to our <span onClick={()=>{navigate('/terms')}} className="cursor-pointer text-blue-600 hover:underline">terms and conditions</span></div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="absolute bottom-2 right-4 text-xs text-gray-500">
          © 2025. Sobha Realty, All rights reserved
        </div>
      </div>
    </div>
  )
}

export default LoginPage
