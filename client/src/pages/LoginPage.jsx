import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Label from "../components/ui/Label"
import Separator from "../components/ui/Separator"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card"

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [microsoftLoginUrl, setMicrosoftLoginUrl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, currentUser, getMicrosoftLoginUrl } = useAuth()
  const { toast } = useToast()

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(location.state?.from?.pathname || "/dashboard")
    }
  }, [currentUser, navigate, location])

  // Fetch Microsoft login URL on component mount
  useEffect(() => {
    const fetchMicrosoftLoginUrl = async () => {
      try {
        const url = await getMicrosoftLoginUrl()
        setMicrosoftLoginUrl(url)
      } catch (error) {
        console.error("Error fetching Microsoft login URL:", error)
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
      navigate(location.state?.from?.pathname || "/dashboard")
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/placeholder.svg" alt="SOBHA Logo" width={240} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">ICSQ Survey System</h1>
          <p className="text-gray-600">Understanding Within, Delight Beyond</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the ICSQ system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
              onClick={handleMicrosoftLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm3 1h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sign in with Microsoft Teams</span>
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
              <div className="space-y-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
